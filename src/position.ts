import { emFork } from './db/connection'
import { NewPosition, Position } from './db'

export async function createPosition(
  newPosition: NewPosition
): Promise<Position> {
  const position = new Position(newPosition)

  const em = await emFork()
  await em.persistAndFlush(position)

  return position
}
