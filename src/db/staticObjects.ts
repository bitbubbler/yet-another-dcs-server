import { StaticObject, StaticObjectTypeName } from '../staticObject'
import { distanceFrom, metersToDegree, PositionLL } from '../common'
import {
  knex,
  StaticObject as DBStaticObject,
  Position as DBPosition,
} from './db'

/**
 *
 * @param staticObject staticObject to insert
 * @returns created staticObjectId
 */
export async function insertStaticObject(
  staticObject: Omit<StaticObject, 'staticObjectId'>
): Promise<StaticObject> {
  const { country, heading, position, typeName } = staticObject
  const { lat, lon } = position

  const alt = 0
  const timestamp = new Date()
  const uuid = knex.fn.uuidToBin(staticObject.uuid)

  // insert position
  const insertPositionResult = await knex('positions')
    .insert({
      lat,
      lon,
      alt,
      heading,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .returning('positionId')

  const [{ positionId }] = insertPositionResult

  const insertStaticObjectResult = await knex('staticObjects')
    .insert({
      country,
      createdAt: timestamp,
      positionId,
      typeName,
      uuid,
      updatedAt: timestamp,
    })
    .returning('staticObjectId')

  const [{ staticObjectId }] = insertStaticObjectResult

  return staticObjectFrom({
    country,
    heading,
    lat,
    lon,
    staticObjectId,
    typeName,
    uuid,
  })
}

export async function deleteStaticObject(
  staticObjectId: number
): Promise<void> {
  await knex('staticObjects').where({ staticObjectId }).delete()
}

export function staticObjectFrom(
  staticObject: Pick<
    DBStaticObject,
    'country' | 'staticObjectId' | 'typeName' | 'uuid'
  > &
    Pick<DBPosition, 'lat' | 'lon' | 'heading'>
): StaticObject {
  const { country, heading, lat, lon, staticObjectId, typeName, uuid } =
    staticObject

  return {
    country,
    heading,
    position: {
      lat,
      lon,
    },
    staticObjectId,
    typeName: typeName as StaticObjectTypeName,
    uuid: knex.fn.binToUuid(uuid),
  }
}

export async function allStaticObjects(): Promise<StaticObject[]> {
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

  return staticObjects.map(staticObjectFrom)
}

/**
 * Search for staticObjects nearby a given PositionLL within a given accuracy.
 * Search uses a very simple box model algorithm to reduce the initial search set
 * @param position PositionLL
 * @param accuracy accuracy of search in meters
 */
export async function nearbyStaticObjects({
  position,
  accuracy,
}: {
  position: PositionLL
  accuracy: number
}): Promise<StaticObject[]> {
  const { lat, lon } = position

  const nearby = await knex('staticObjects')
    .innerJoin('positions', 'staticObjects.positionId', 'positions.positionId')
    .select([
      'alt',
      'country',
      'heading',
      'lat',
      'lon',
      'staticObjectId',
      'typeName',
      'uuid',
    ])
    .whereBetween('lat', [
      lat - metersToDegree(accuracy),
      lat + metersToDegree(accuracy),
    ])
    .whereBetween('lon', [
      lon - metersToDegree(accuracy),
      lon + metersToDegree(accuracy),
    ])
    .whereNull('goneAt')

  return nearby
    .map(dbStaticObject => {
      const staticObject = staticObjectFrom(dbStaticObject)

      return {
        staticObject,
        distance: distanceFrom(position, staticObject.position),
      }
    })
    .filter(staticObject => staticObject.distance <= accuracy)
    .sort((a, b) => a.distance - b.distance)
    .map(staticObject => staticObject.staticObject)
}
