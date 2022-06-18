import { knex } from './db'
import { countryFrom } from '../country'
import { getPositionVelocity, Unit } from '../unit'
import { deg } from '../common'
import { equal } from 'assert'

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
