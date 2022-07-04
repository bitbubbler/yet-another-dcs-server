import { Coalition } from '../../generated/dcs/common/v0/Coalition'
import { PositionLL } from '../types'

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
  coalition: Coalition
  position: PositionLL
  type: SpawnerType
}
