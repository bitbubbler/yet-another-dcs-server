import { knex, Unit as DBUnit, Position as DBPosition } from './db'
import { countryFrom } from '../country'
import { getPositionVelocity, Unit } from '../unit'
import { metersToDegree, headingFrom } from '../common'
import { equal } from 'assert'
import { PositionLL } from '../common'
import { Coalition } from '../generated/dcs/common/v0/Coalition'
import { LatLon } from '../geo'

export async function insertUnit(
  unit: Pick<
    Unit,
    | 'country'
    | 'heading'
    | 'hidden'
    | 'isPlayerSlot'
    | 'name'
    | 'position'
    | 'typeName'
  >
): Promise<Unit> {
  const {
    country,
    heading,
    hidden,
    name,
    position: positionLL,
    typeName,
  } = unit

  const { alt, lat, lon } = positionLL

  const isPlayerSlot = unit.isPlayerSlot ? 1 : 0

  const timestamp = new Date()

  // insert the position
  const newPositionResult = await knex('positions')
    .insert({
      alt,
      createdAt: timestamp,
      heading,
      lat,
      lon,
      updatedAt: timestamp,
    })
    .returning(['positionId'])

  if (newPositionResult.length < 1) {
    throw new Error('missing position result')
  }

  const [{ positionId }] = newPositionResult

  equal(typeof positionId, 'number')

  // insert the unit
  const newUnitResult = await knex('units')
    .insert({
      country,
      createdAt: timestamp,
      hidden,
      isPlayerSlot,
      name,
      positionId,
      typeName,
      updatedAt: timestamp,
    })
    .returning(['unitId'])

  if (newUnitResult.length < 1) {
    throw new Error('missing unit result')
  }

  const [{ unitId }] = newUnitResult

  equal(typeof unitId, 'number')

  return unitFrom({
    alt,
    country,
    heading,
    hidden,
    isPlayerSlot,
    name,
    lat,
    lon,
    typeName,
    unitId,
  })
}

export async function updateUnitPosition(
  unit: Pick<Unit, 'name' | 'position'>
): Promise<void> {
  const { name, position: positionLL } = unit

  const { lat, lon, alt } = positionLL

  const [position3] = await getPositionVelocity(name)

  const heading = headingFrom(position3)

  const timestamp = new Date()

  // try to find existing unit
  const existingUnitResult = await knex('units')
    .leftOuterJoin('positions', function () {
      this.on('units.positionId', '=', 'positions.positionId')
    })
    .where('units.name', name)
    .select('*')
    .first()

  if (typeof existingUnitResult === 'undefined') {
    throw new Error(`No known unit with name ${name} to update`)
  }
  // unit already exists, and should have a position
  // find the positionId on the existing unit and upate it
  const { positionId } = existingUnitResult

  equal(typeof positionId, 'number')

  await knex('positions')
    .where({
      positionId,
    })
    .update({
      lat,
      lon,
      alt,
      heading,
      updatedAt: timestamp,
    })
}

export async function unitGone(unit: Pick<Unit, 'name'>): Promise<void> {
  const { name } = unit

  const timestamp = new Date()

  await knex('units').where({ name }).update({
    updatedAt: timestamp,
    goneAt: timestamp,
  })
}

export async function unitDestroyed(unit: Pick<Unit, 'name'>): Promise<void> {
  const { name } = unit

  const timestamp = new Date()

  await knex('units').where({ name }).update({
    updatedAt: timestamp,
    destroyedAt: timestamp,
    goneAt: timestamp, // if we're setting destroyedAt, we must also set goneAT
  })
}

export async function findUnit(name: string): Promise<Unit | undefined> {
  const foundUnit = await knex('units')
    .select('*')
    .innerJoin('positions', 'units.positionId', 'positions.positionId')
    .where({ name })
    .whereNull('destroyedAt')
    .whereNull('goneAt')
    .first()

  if (foundUnit) {
    return unitFrom(foundUnit)
  }
  return undefined
}

/**
 * Search for units nearby a given PositionLL within a given accuracy.
 * Search uses a very simple box model algorithm
 * @param position PositionLL
 * @param accuracy accuracy of search in meters
 */
export async function nearbyUnits({
  position,
  accuracy,
  coalition,
}: {
  position: PositionLL
  accuracy: number
  coalition: Coalition
}): Promise<Unit[]> {
  const { lat, lon } = position

  let query = knex('units')
    .innerJoin('positions', 'units.positionId', 'positions.positionId')
    .select('*')
    .whereBetween('lat', [
      lat - metersToDegree(accuracy),
      lat + metersToDegree(accuracy),
    ])
    .whereBetween('lon', [
      lon - metersToDegree(accuracy),
      lon + metersToDegree(accuracy),
    ])
    .whereNull('destroyedAt')
    .whereNull('goneAt')

  // if not Coalition_ALL, search by country
  if (Coalition.COALITION_ALL !== coalition) {
    const country = countryFrom(coalition)
    query = query.where({ country })
  }

  const nearby = await query

  return await nearby
    .map(dbUnit => {
      const unit = unitFrom(dbUnit)
      return {
        unit,
        distance: new LatLon(position.lat, position.lon).distanceTo(
          new LatLon(unit.position.lat, unit.position.lon)
        ),
      }
    })
    .filter(unit => unit.distance <= accuracy)
    .sort((a, b) => a.distance - b.distance)
    .map(unit => unit.unit)
}

export function unitFrom(
  dbUnit: Pick<DBUnit, 'country' | 'hidden' | 'name' | 'typeName' | 'unitId'> &
    Pick<DBPosition, 'lat' | 'lon' | 'alt' | 'heading'> & {
      isPlayerSlot: number | boolean
    }
): Unit {
  const {
    alt,
    country,
    heading,
    hidden,
    isPlayerSlot,
    lat,
    lon,
    name,
    typeName,
    unitId,
  } = dbUnit

  return {
    country,
    heading,
    hidden,
    isPlayerSlot: Boolean(isPlayerSlot),
    name,
    position: {
      alt,
      lat,
      lon,
    },
    typeName,
    unitId,
  }
}

export async function deleteUnit(unitId: Unit['unitId']): Promise<void> {
  await knex('units').where({ unitId }).delete()
}
