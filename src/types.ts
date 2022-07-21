import { Position__Output } from '../generated/dcs/common/v0/Position'

export type TeardownFn = () => Promise<void>

export type Distance = number

export interface Vec2 {
  x: Distance
  y: Distance
}

export interface Vec3 {
  x: Distance
  y: Distance
  z: Distance
}

export type PositionLL = Required<Position__Output>

export interface Position3 {
  p: Vec3
  x: Vec3
  y: Vec3
  z: Vec3
}

export type Velocity = Vec3
