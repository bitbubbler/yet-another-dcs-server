import { Position } from '../position'
import { knex, Position as DBPosition, PositionInsert } from './db'

export async function insertPosition(
  newPosition: Omit<PositionInsert, 'createdAt' | 'updatedAt'>
): Promise<Position> {
  const timestamp = new Date()

  // insert position
  const insertPositionResult = await knex('positions')
    .insert({ ...newPosition, createdAt: timestamp, updatedAt: timestamp })
    .returning('*')

  const [position] = insertPositionResult

  return position
}

export function positionFrom(row: { position: DBPosition }): Position {
  const { positionId, lat, lon, alt, heading } = row.position

  return {
    positionId,
    lat,
    lon,
    alt,
    heading,
  }
}
