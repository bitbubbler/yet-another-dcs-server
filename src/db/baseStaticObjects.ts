import { Base, knex } from './db'
import { equal } from 'assert'
import { StaticObject } from '../staticObject'
import { staticObjectFrom } from './staticObjects'

export async function insertBaseStaticObject(
  baseId: Base['baseId'],
  staticObjectId: StaticObject['staticObjectId']
): Promise<void> {
  // insert position
  const insertPositionResult = await knex('baseStaticObjects').insert({
    baseId,
    staticObjectId,
  })

  // expect one result
  equal(insertPositionResult.length, 1)
}

export async function allBaseStaticObjects(
  baseId: Base['baseId']
): Promise<StaticObject[]> {
  const staticObjects = await knex('staticObjects')
    .innerJoin('positions', 'staticObjects.positionId', 'positions.positionId')
    .select([
      'country',
      'heading',
      'lat',
      'lon',
      'staticObjectId',
      'typeName',
      'uuid',
    ])
    .whereIn(
      'staticObjectId',
      knex('baseStaticObjects').select('staticObjectId').where({ baseId })
    )

  return staticObjects.map(staticObjectFrom)
}

export async function deleteBaseStaticObject(
  baseId: Base['baseId'],
  staticObjectId: StaticObject['staticObjectId']
): Promise<void> {
  await knex('baseStaticObjects').where({ baseId, staticObjectId }).delete()
}
