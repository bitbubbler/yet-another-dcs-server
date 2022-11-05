import { knex } from './db'
import { distanceFrom, metersToDegree, PositionLL } from './common'
import { Coalition } from '../generated/dcs/common/v0/Coalition'

/**
 * IMPORTANT: DO NOT CHANGE THE NUMBER ON EACH OF THESE TYPES. Doing so is a breaking change
 * The number associate with each of these enums is used as a database value.
 * You may append to the end (add new numbers) only
 * Explicitly define the value for each entry so that there is no confusion
 */
export enum SpawnerType {
  Easy = 0,
  Medium = 1,
  Hard = 2,
}

export interface Spawner {
  spawnerId: number
  coalition: Coalition
  position: PositionLL
  type: SpawnerType
}

/**
 * Search for spawners nearby a given PositionLL within a given accuracy.
 * Search uses a very simple box model algorithm to reduce the initial search set
 * @param position PositionLL
 * @param accuracy accuracy of search in meters
 */
export async function nearbySpawners({
  position,
  accuracy,
  coalition,
}: {
  position: PositionLL
  accuracy: number
  coalition: Coalition
}) {
  const { lat, lon } = position

  let query = knex('spawners')
    .leftOuterJoin('positions', function () {
      this.on('spawners.positionId', '=', 'positions.positionId')
    })
    .select(['spawnerId', 'lat', 'lon', 'alt'])
    .whereBetween('lat', [
      lat - metersToDegree(accuracy),
      lat + metersToDegree(accuracy),
    ])
    .whereBetween('lon', [
      lon - metersToDegree(accuracy),
      lon + metersToDegree(accuracy),
    ])
    .whereNull('goneAt')
    .whereNull('capturedAt')

  // if not all, search by coalition
  if (Coalition.COALITION_ALL !== coalition) {
    query = query.where({ coalition })
  }

  const nearby = await query

  return nearby
    .map(unit => {
      const { lat, lon, alt } = unit
      const unitPosition = { lat, lon, alt }
      return { unit, distance: distanceFrom(position, unitPosition) }
    })
    .filter(unit => unit.distance <= accuracy)
    .sort((a, b) => a.distance - b.distance)
    .map(unit => unit.unit)
}
