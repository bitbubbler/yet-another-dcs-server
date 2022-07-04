import { knex } from './db'
import { Spawner } from '../autoRespawn/types'
import { distanceFrom, metersToDegree } from '../common'
import { equal } from 'assert'
import { PositionLL } from '../types'

/**
 *
 * @param spawner spawner to insert
 * @returns created spawnerId
 */
export async function insertSpawner(spawner: Spawner): Promise<number> {
  const { coalition, position, type } = spawner

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

  const insertSpawnerResult = await knex('spawners')
    .insert({
      positionId,
      coalition,
      type,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .returning('spawnerId')

  const [{ spawnerId }] = insertSpawnerResult

  return spawnerId
}

export async function updateSpawnerPosition(
  spawner: Pick<Spawner, 'position'> & { spawnerId: number }
): Promise<void> {
  const { spawnerId, position: positionLL } = spawner

  const { lat, lon, alt } = positionLL

  const timestamp = new Date()

  // try to find existing spawner
  const existingSpawnerResult = await knex('spawners')
    .leftOuterJoin('positions', function () {
      this.on('spawners.positionId', '=', 'positions.positionId')
    })
    .where('spawners.spawnerId', spawnerId)
    .select('*')
    .limit(1)

  // spawner not exists, insert
  if (existingSpawnerResult.length < 1) {
    throw new Error(
      `expected an existing spawner to update with id ${spawnerId}`
    )
  } else {
    // spawner already exists, and should have a position
    // find the positionId on the existing spawner and upate it
    const [{ positionId }] = existingSpawnerResult

    equal(typeof positionId, 'number')

    await knex('positions')
      .update({
        lat,
        lon,
        alt,
        updatedAt: timestamp,
      })
      .where({
        positionId,
      })
  }
}

export async function spawnerDestroyed(spawnerId: number): Promise<void> {
  const timestamp = new Date()

  await knex('spawners')
    .update({
      updatedAt: timestamp,
      destroyedAt: timestamp,
    })
    .where({ spawnerId })
}

/**
 * Search for spawners nearby a given PositionLL within a given accuracy.
 * Search uses a very simple box model algorithm to reduce the initial search set
 * @param position PositionLL
 * @param accuracy accuracy of search in meters
 */
export async function nearbySpawners(position: PositionLL, accuracy: number) {
  const { lat, lon } = position

  const nearby = await knex('spawners')
    .leftOuterJoin('positions', function () {
      this.on('spawners.positionId', '=', 'positions.positionId')
    })
    .select(['spawnerId', 'lat', 'lon', 'alt'])
    .whereBetween('lat', [
      lat - metersToDegree(accuracy),
      lat + metersToDegree(accuracy),
    ])
    .whereBetween('lon', [
      lon - metersToDegree(accuracy),
      lon + metersToDegree(accuracy),
    ])

  return nearby
    .map(unit => {
      const { lat, lon, alt } = unit
      const unitPosition = { lat, lon, alt }
      return { unit, distance: distanceFrom(position, unitPosition) }
    })
    .filter(unit => unit.distance <= accuracy)
    .sort((a, b) => a.distance - b.distance)
    .map(unit => unit.unit)
}
