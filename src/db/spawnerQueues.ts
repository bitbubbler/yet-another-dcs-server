import { knex } from './db'
import { equal } from 'assert'

export async function insertSpawnerQueue(
  spawnerId: number,
  unitId: number
): Promise<void> {
  const timestamp = new Date()

  // insert position
  const insertPositionResult = await knex('spawnerQueues').insert({
    spawnerId,
    unitId,
    createdAt: timestamp,
  })

  // expect one result
  equal(insertPositionResult.length, 1)
}

export async function spawnerQueueDone(
  spawnerId: number,
  unitId: number
): Promise<void> {
  const timestamp = new Date()

  await knex('spawnerQueues')
    .update({
      doneAt: timestamp,
    })
    .where({ spawnerId, unitId })
}
