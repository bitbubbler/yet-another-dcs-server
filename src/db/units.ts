import { knex } from './db'
import { countryFrom } from '../country'
import { getPositionVelocity, Unit } from '../unit'
import { deg, metersToDegree } from '../common'
import { equal } from 'assert'
import { PositionLL } from '../types'
import { coalitionFrom } from '../coalition'

export async function insertOrUpdateUnit(unit: Unit): Promise<void> {
  const { name, position: positionLL, type: typeName, coalition } = unit

  const country = countryFrom(coalition)

  const { lat, lon, alt } = positionLL

  if (typeof lat !== 'number') {
    throw new Error('expected lat to be a number')
  }
  if (typeof lon !== 'number') {
    throw new Error('expected lon to be a number')
  }
  if (typeof alt !== 'number') {
    throw new Error('expected alt to be a number')
  }

  const [position3] = await getPositionVelocity(name)

  let heading = deg(Math.atan2(position3.x.z, position3.x.x))
  if (heading < 0) {
    heading = heading + 360
  }

  const timestamp = new Date()

  // try to find existing unit
  const existingUnitResult = await knex('units')
    .leftOuterJoin('positions', function () {
      this.on('units.positionId', '=', 'positions.positionId')
    })
    .where('units.name', name)
    .select('*')
    .limit(1)

  // unit not exists, insert
  if (existingUnitResult.length < 1) {
    // insert the position
    const newPositionResult = await knex('positions')
      .insert({
        lat,
        lon,
        alt,
        heading,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      .returning(['positionId'])

    if (newPositionResult.length < 1) {
      throw new Error('missing position result')
    }

    const [{ positionId }] = newPositionResult

    equal(typeof positionId, 'number')

    // insert the unit
    await knex('units').insert({
      name,
      country,
      typeName,
      positionId,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
  } else {
    // unit already exists, and should have a position
    // find the positionId on the existing unit and upate it
    const [{ positionId }] = existingUnitResult

    equal(typeof positionId, 'number')

    await knex('positions')
      .update({
        lat,
        lon,
        alt,
        heading,
        updatedAt: timestamp,
      })
      .where({
        positionId,
      })
  }
}

export async function unitGone(unit: Pick<Unit, 'name'>): Promise<void> {
  const { name } = unit

  const timestamp = new Date()

  await knex('units')
    .update({
      updatedAt: timestamp,
      goneAt: timestamp,
    })
    .where({ name })
}

export async function findUnit(name: string): Promise<Unit | undefined> {
  const foundUnit = await knex('units')
    .select('*')
    .where({ name })
    .leftJoin('positions', 'units.positionId', 'positions.positionId')
    .first()

  if (foundUnit) {
    const { alt, country, lat, lon, name, typeName, unitId: id } = foundUnit
    return {
      id,
      name,
      coalition: coalitionFrom(country),
      type: typeName,
      position: {
        lat,
        lon,
        alt,
      },
      // TODO: determine what to do with the below in the types
      callsign: undefined,
      playerName: undefined,
      groupName: undefined,
      numberInGroup: undefined,
    }
  }
  return undefined
}

/**
 * Search for units nearby a given PositionLL within a given accuracy.
 * Search uses a very simple box model algorithm
 * @param position PositionLL
 * @param accuracy accuracy of search in meters
 */
export async function nearbyUnits(position: PositionLL, accuracy: number) {
  const { lat, lon } = position

  return await knex('units')
    .leftOuterJoin('positions', function () {
      this.on('units.positionId', '=', 'positions.positionId')
    })
    .select(['unitId', 'name', 'country', 'lat', 'lon', 'alt'])
    .whereBetween('lat', [
      lat - metersToDegree(accuracy),
      lat + metersToDegree(accuracy),
    ])
    .whereBetween('lon', [
      lon - metersToDegree(accuracy),
      lon + metersToDegree(accuracy),
    ])
}
