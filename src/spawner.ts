import { Coalition } from './__generated__/dcs/common/v0/Coalition'

import { metersToDegree } from './common'
import { distanceFrom } from './convert'
import { NewSpawner, Position, Spawner } from './db'
import { emFork } from './db/connection'

export async function createSpawner(newSpawner: NewSpawner): Promise<Spawner> {
  const spawner = new Spawner(newSpawner)

  const em = await emFork()
  await em.persistAndFlush(spawner)

  return spawner
}

export async function findNearbySpawners({
  position,
  accuracy,
  coalition,
}: {
  position: Pick<Position, 'lat' | 'lon'>
  accuracy: number
  coalition: Coalition
}): Promise<Spawner[]> {
  const em = await emFork()
  const spawnerRepository = em.getRepository(Spawner)
  const { lat, lon } = position

  let query = spawnerRepository
    .createQueryBuilder()
    .select('*')
    .where({
      $and: [
        { position: { lat: { $gte: lat - metersToDegree(accuracy) } } },
        { position: { lat: { $lte: lat + metersToDegree(accuracy) } } },
        { position: { lon: { $gte: lon - metersToDegree(accuracy) } } },
        { position: { lon: { $lte: lon + metersToDegree(accuracy) } } },
      ],
    })

  // if not all, search by coalition
  if (Coalition.COALITION_ALL !== coalition) {
    query = query.andWhere({ coalition })
  }

  const nearby = await query

  return nearby
    .map(spawner => {
      return { spawner, distance: distanceFrom(position, spawner.position) }
    })
    .filter(spawner => spawner.distance <= accuracy)
    .sort((a, b) => a.distance - b.distance)
    .map(spawner => spawner.spawner)
}

export async function allSpawners(): Promise<Spawner[]> {
  const em = await emFork()
  return em.find(Spawner, {})
}

export async function spawnerDestroyed(spawner: Spawner): Promise<void> {
  spawner.destroyed()

  const em = await emFork()
  await em.persistAndFlush(spawner)
}
