import { entityManager, orm, Position, NewSpawner, Spawner } from './db'
import { distanceFrom, metersToDegree } from './common'
import { Coalition } from './generated/dcs/common/v0/Coalition'

export async function createSpawner(newSpawner: NewSpawner): Promise<Spawner> {
  const spawner = new Spawner(newSpawner)

  await entityManager(await orm)
    .persist(spawner)
    .flush()

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
  const em = entityManager(await orm)

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
  return entityManager(await orm).find(Spawner, {})
}

export async function spawnerDestroyed(spawner: Spawner): Promise<void> {
  const em = entityManager(await orm)

  spawner.destroyed()

  await em.persist(spawner).flush()
}
