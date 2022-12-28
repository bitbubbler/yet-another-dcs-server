import { equal } from 'assert'
import { Coalition } from '../../generated/dcs/common/v0/Coalition'
import { Base } from '../base'
import { metersToDegree, PositionLL } from '../common'
import { LatLon } from '../geo'
import { Base as DBBase, knex, Position as DBPosition } from './db'

export async function insertBase(
  base: Pick<Base, 'coalition' | 'heading' | 'name' | 'position' | 'type'>
): Promise<Base> {
  const { coalition, heading, name, position: positionLL, type } = base

  const { lat, lon } = positionLL

  const timestamp = new Date()

  // insert the position
  const newPositionResult = await knex('positions')
    .insert({
      lat,
      lon,
      alt: 0,
      heading,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .returning(['positionId'])

  if (newPositionResult.length < 1) {
    throw new Error('missing position result')
  }

  const [{ positionId }] = newPositionResult

  equal(typeof positionId, 'number')

  // insert the unit
  const newBaseResult = await knex('bases')
    .insert({
      name,
      coalition,
      type,
      positionId,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .returning(['baseId'])

  if (newBaseResult.length < 1) {
    throw new Error('missing base result')
  }

  const [{ baseId }] = newBaseResult

  equal(typeof baseId, 'number')

  return baseFrom({
    baseId,
    coalition,
    heading,
    lat,
    lon,
    name,
    type,
  })
}

export async function updateBaseType(
  base: Pick<Base, 'baseId' | 'type'>
): Promise<void> {
  const { baseId, type } = base
  const timestamp = new Date()

  await knex('bases').where({ baseId }).update({
    type,
    updatedAt: timestamp,
  })
}

export async function baseGone(baseId: number): Promise<void> {
  const timestamp = new Date()

  await knex('bases').where({ baseId }).update({
    updatedAt: timestamp,
    goneAt: timestamp,
  })
}

export function baseFrom(
  base: Pick<DBBase, 'baseId' | 'type' | 'name' | 'coalition'> &
    Pick<DBPosition, 'lat' | 'lon' | 'heading'>
): Base {
  const { baseId, coalition, heading, lat, lon, name, type } = base

  return {
    baseId,
    coalition,
    heading,
    name,
    position: {
      lat,
      lon,
    },
    type,
  }
}

export async function allBases(): Promise<Base[]> {
  const bases = await knex('bases')
    .innerJoin('positions', 'bases.positionId', 'positions.positionId')
    .select(['baseId', 'coalition', 'heading', 'lat', 'lon', 'name', 'type'])
    .whereNull('goneAt')

  return bases.map(base => baseFrom(base))
}

/**
 * Search for bases nearby a given PositionLL within a given accuracy.
 * Search uses a very simple box model algorithm to reduce the initial search set
 */
export async function nearbyBases({
  position,
  accuracy,
  coalition,
}: {
  /** position to search from */
  position: Pick<PositionLL, 'lat' | 'lon'>
  /** accuracy of search in meters */
  accuracy: number
  /** coalition to search for */
  coalition: Coalition
}): Promise<Base[]> {
  const { lat, lon } = position

  let query = knex('bases')
    .innerJoin('positions', 'bases.positionId', 'positions.positionId')
    .select('*')
    .whereBetween('lat', [
      lat - metersToDegree(accuracy),
      lat + metersToDegree(accuracy),
    ])
    .whereBetween('lon', [
      lon - metersToDegree(accuracy),
      lon + metersToDegree(accuracy),
    ])
    .whereNull('goneAt')

  // if not Coalition_ALL, search by country
  if (Coalition.COALITION_ALL !== coalition) {
    query = query.where({ coalition })
  }

  const nearby = await query

  return nearby
    .map(dbBase => {
      const base = baseFrom(dbBase)

      return {
        base,
        distance: new LatLon(position.lat, position.lon).distanceTo(
          new LatLon(base.position.lat, base.position.lon)
        ),
      }
    })
    .filter(base => base.distance <= accuracy)
    .sort((a, b) => a.distance - b.distance)
    .map(base => base.base)
}

export async function deleteBase({ baseId }: Base): Promise<void> {
  await knex('bases')
    .where({
      baseId,
    })
    .delete()
}
