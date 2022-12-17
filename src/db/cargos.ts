import { equal } from 'assert'
import {
  BaseCargo,
  Cargo,
  CargoType,
  isBaseCargoType,
  UnitCargo,
} from '../cargo'
import { distanceFrom, metersToDegree, PositionLL } from '../common'
import { knex, Cargo as DBCargo, Position as DBPosition } from './db'

/**
 *
 * @param cargo cargo to insert
 * @returns created cargoId
 */
export async function insertCargo(
  cargo: Omit<BaseCargo, 'cargoId'> | Omit<UnitCargo, 'cargoId'>
): Promise<Cargo> {
  const { displayName, internal, mass, position, type, typeName } = cargo

  const uuid = knex.fn.uuidToBin(cargo.uuid)

  const { lat, lon, alt } = position

  const timestamp = new Date()

  // insert position
  const insertPositionResult = await knex('positions')
    .insert({
      lat,
      lon,
      alt,
      heading: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .returning('positionId')

  const [{ positionId }] = insertPositionResult

  if (CargoType.UnitCreate === cargo.type) {
    const { unitTypeName } = cargo
    const insertCargoResult = await knex('cargos')
      .insert({
        createdAt: timestamp,
        displayName,
        internal,
        mass,
        positionId,
        type,
        typeName,
        unitTypeName,
        uuid,
        updatedAt: timestamp,
      })
      .returning('cargoId')

    const [{ cargoId }] = insertCargoResult

    return cargoFrom({
      alt,
      cargoId,
      displayName,
      internal,
      lat,
      lon,
      mass,
      type,
      typeName,
      unitTypeName,
      uuid,
    })
  }

  const insertCargoResult = await knex('cargos')
    .insert({
      createdAt: timestamp,
      displayName,
      internal,
      mass,
      positionId,
      type,
      typeName,
      uuid,
      updatedAt: timestamp,
    })
    .returning('cargoId')

  const [{ cargoId }] = insertCargoResult

  return cargoFrom({
    alt,
    cargoId,
    displayName,
    internal,
    lat,
    lon,
    mass,
    type,
    typeName,
    uuid,
  })
}

export async function updateCargoPosition(
  cargo: Pick<Cargo, 'position'> & { cargoId: number }
): Promise<void> {
  const { cargoId, position: positionLL } = cargo

  const { lat, lon, alt } = positionLL

  const timestamp = new Date()

  // try to find existing cargo
  const existingCargoResult = await knex('cargos')
    .innerJoin('positions', 'cargos.positionId', 'positions.positionId')
    .where('cargos.cargoId', cargoId)
    .select('*')
    .limit(1)

  // cargo not exists, insert
  if (existingCargoResult.length < 1) {
    throw new Error(`expected an existing cargo to update with id ${cargoId}`)
  } else {
    // cargo already exists, and should have a position
    // find the positionId on the existing cargo and upate it
    const [{ positionId }] = existingCargoResult

    equal(typeof positionId, 'number')

    await knex('positions')
      .where({
        positionId,
      })
      .update({
        lat,
        lon,
        alt,
        updatedAt: timestamp,
      })
  }
}

export async function cargoGone(cargoId: number): Promise<void> {
  const timestamp = new Date()

  await knex('cargos').where({ cargoId }).update({
    updatedAt: timestamp,
    goneAt: timestamp,
  })
}

export function cargoFrom(
  cargo: Pick<
    DBCargo,
    | 'cargoId'
    | 'displayName'
    | 'internal'
    | 'mass'
    | 'type'
    | 'typeName'
    | 'unitTypeName'
    | 'uuid'
  > &
    Pick<DBPosition, 'lat' | 'lon' | 'alt'>
): Cargo {
  const {
    alt,
    cargoId,
    displayName,
    internal,
    lat,
    lon,
    mass,
    typeName,
    unitTypeName,
    uuid,
  } = cargo

  if (isBaseCargoType(cargo.type)) {
    const type = cargo.type as BaseCargo['type']
    const baseCargo: BaseCargo = {
      cargoId,
      displayName,
      internal,
      mass,
      position: {
        alt,
        lat,
        lon,
      },
      type,
      typeName,
      uuid: knex.fn.binToUuid(uuid),
    }

    return baseCargo
  }

  if (CargoType.UnitCreate === cargo.type) {
    const type = cargo.type as UnitCargo['type']

    if (typeof unitTypeName === 'undefined') {
      throw new Error(
        `Unexpected error while converting DbCargo to UnitCargo: missing unitTypeName for record ${cargoId}`
      )
    }

    return {
      cargoId,
      displayName,
      internal,
      mass,
      position: {
        alt,
        lat,
        lon,
      },
      type,
      typeName,
      unitTypeName,
      uuid: knex.fn.binToUuid(uuid),
    }
  }

  throw new Error('unknown cargo type')
}

export async function allCargos(): Promise<Cargo[]> {
  const cargos = await knex('cargos')
    .innerJoin('positions', 'cargos.positionId', 'positions.positionId')
    .select([
      'alt',
      'cargoId',
      'displayName',
      'internal',
      'mass',
      'lat',
      'lon',
      'type',
      'typeName',
      'uuid',
    ])
    .whereNull('goneAt')

  return cargos.map(cargoFrom)
}

/**
 * Search for cargos nearby a given PositionLL within a given accuracy.
 * Search uses a very simple box model algorithm to reduce the initial search set
 * @param position PositionLL
 * @param accuracy accuracy of search in meters
 */
export async function nearbyCargos({
  position,
  accuracy,
}: {
  position: PositionLL
  accuracy: number
}): Promise<Cargo[]> {
  const { lat, lon } = position

  const nearby = await knex('cargos')
    .innerJoin('positions', 'cargos.positionId', 'positions.positionId')
    .select([
      'alt',
      'cargoId',
      'displayName',
      'internal',
      'mass',
      'lat',
      'lon',
      'type',
      'typeName',
      'uuid',
    ])
    .whereBetween('lat', [
      lat - metersToDegree(accuracy),
      lat + metersToDegree(accuracy),
    ])
    .whereBetween('lon', [
      lon - metersToDegree(accuracy),
      lon + metersToDegree(accuracy),
    ])
    .whereNull('goneAt')

  return nearby
    .map(dbCargo => {
      const cargo = cargoFrom(dbCargo)

      return { cargo, distance: distanceFrom(position, cargo.position) }
    })
    .filter(cargo => cargo.distance <= accuracy)
    .sort((a, b) => a.distance - b.distance)
    .map(cargo => cargo.cargo)
}
