import { entityManager, orm } from './db/connection.mjs'
import { NewPosition, Position } from './db'

export async function createPosition(
  newPosition: NewPosition
): Promise<Position> {
  const position = new Position(newPosition)

  await entityManager(await orm)
    .persist(position)
    .flush()

  return position
}
