import { knex } from './db'
import { Spawner } from '../spawner'
import { equal } from 'assert'

/**
 *
 * @param spawner spawner to insert
 * @returns created spawnerId
 */
export async function insertSpawner(
  spawner: Omit<Spawner, 'spawnerId'>
): Promise<number> {
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

export async function spawnerDestroyed(spawnerId: number): Promise<void> {
  const timestamp = new Date()

  await knex('spawners').where({ spawnerId }).update({
    updatedAt: timestamp,
    destroyedAt: timestamp,
    goneAt: timestamp,
  })
}

export async function spawnerGone(spawnerId: number): Promise<void> {
  const timestamp = new Date()

  await knex('spawners').where({ spawnerId }).update({
    updatedAt: timestamp,
    goneAt: timestamp,
  })
}

export async function allSpawners(): Promise<Spawner[]> {
  const spawners = await knex('spawners')
    .innerJoin('positions', 'spawners.positionId', 'positions.positionId')
    .whereNull('goneAt')
    .whereNull('capturedAt')

  return spawners.map(spawner => {
    const { spawnerId, lat, lon, alt, coalition, type } = spawner

    return {
      coalition,
      position: {
        alt,
        lat,
        lon,
      },
      spawnerId,
      type,
    }
  })
}
