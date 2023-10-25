import { Group__Output } from '../__generated__/dcs/common/v0/Group'
import { Orientation__Output } from '../__generated__/dcs/common/v0/Orientation'
import { Position__Output } from '../__generated__/dcs/common/v0/Position'
import { Unit__Output } from '../__generated__/dcs/common/v0/Unit'
import { Vector__Output } from '../__generated__/dcs/common/v0/Vector'
import { Velocity__Output } from '../__generated__/dcs/common/v0/Velocity'
import { Color__Output } from '../__generated__/dcs/trigger/v0/Color'
import { _dcs_trigger_v0_SmokeRequest_SmokeColor as GameSmokeColor } from '../__generated__/dcs/trigger/v0/SmokeRequest'

export type Distance = number

/**
 * Game Types
 */
/** */
// Enums need to be re-exported
export { GameSmokeColor }

export type GameColor = Required<Color__Output>
export type GameGroup = Required<Group__Output>
export type GameOrientation = Required<
  Pick<Orientation__Output, 'heading' | 'yaw' | 'pitch' | 'roll'>
> & {
  forward: GameVector
  right: GameVector
  up: GameVector
}
export type GamePosition = Required<Position__Output>
export type GamePositionLL = Required<
  Pick<Position__Output, 'alt' | 'lat' | 'lon'>
>
export type GameUnit = Required<
  Pick<Unit__Output, 'id' | 'name' | 'coalition' | 'type'>
> & {
  group: GameGroup
  orientation: GameOrientation
  playerName: string | undefined
  position: GamePosition
  velocity: GameVelocity
}
export type GameVector = Required<Vector__Output>
export type GameVelocity = Required<Velocity__Output>

export interface GameVec2 {
  x: Distance
  y: Distance
}

export interface GameVec3 {
  x: Distance
  y: Distance
  z: Distance
}

export interface GamePosition3 {
  p: GameVec3
  x: GameVec3
  y: GameVec3
  z: GameVec3
}

export interface GamePositionMGRS {
  Easting: number
  MGRSDigraph: string
  Northing: number
  UTMZone: string
}
