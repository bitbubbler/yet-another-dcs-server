import { equal } from 'assert'
import { Coalition } from './__generated__/dcs/common/v0/Coalition'
import { Country } from './__generated__/dcs/common/v0/Country'
import { Position__Output } from './__generated__/dcs/common/v0/Position'
import { Unit__Output } from './__generated__/dcs/common/v0/Unit'
import {
  GameGroup,
  GameOrientation,
  GamePosition,
  GamePosition3,
  GamePositionLL,
  GameUnit,
  GameVec3,
  GameVector,
  GameVelocity,
} from './types'
import { LatLon } from './geo'
import { Group__Output } from './__generated__/dcs/common/v0/Group'
import { Orientation__Output } from './__generated__/dcs/common/v0/Orientation'
import { Velocity__Output } from './__generated__/dcs/common/v0/Velocity'
import { MissingPropertyError } from './errors'
import { Vector__Output } from './__generated__/dcs/common/v0/Vector'

export function countryFrom(coalition: Coalition): Country {
  if (coalition === Coalition.COALITION_BLUE) {
    return Country.COUNTRY_COMBINED_JOINT_TASK_FORCE_BLUE
  }
  if (coalition === Coalition.COALITION_RED) {
    return Country.COUNTRY_COMBINED_JOINT_TASK_FORCE_RED
  }
  // TODO: determine if this is a safe default
  return Country.COUNTRY_UNITED_NATIONS_PEACEKEEPERS
}

/**
 * Returns a distance in meters given two GamePositionLL
 * @param positiona GamePositionLL
 * @param positionb GamePositionLL
 */
export function distanceFrom(
  a: Pick<GamePositionLL, 'lat' | 'lon'>,
  b: Pick<GamePositionLL, 'lat' | 'lon'>
): number {
  return new LatLon(a.lat, a.lon).distanceTo(new LatLon(b.lat, b.lon))
}

/**
 * Returns a compass bearing given two GamePositionLL
 * @param a starting position
 * @param b ending position
 * @returns the bearing from the starting position to the ending position
 */
export function bearingFrom(
  a: Pick<GamePositionLL, 'lat' | 'lon'>,
  b: Pick<GamePositionLL, 'lat' | 'lon'>
): number {
  return new LatLon(a.lat, a.lon).initialBearingTo(new LatLon(b.lat, b.lon))
}

export function gameVec3From(maybeVec3: Partial<GameVec3>): GameVec3 {
  if ('x' in maybeVec3 === false || typeof maybeVec3.x === 'undefined') {
    throw new Error('expected x to be a number')
  }
  if ('y' in maybeVec3 === false || typeof maybeVec3.y === 'undefined') {
    throw new Error('expected y to be a number')
  }
  if ('z' in maybeVec3 === false || typeof maybeVec3.z === 'undefined') {
    throw new Error('expected z to be a number')
  }

  equal(typeof maybeVec3.x, 'number')
  equal(typeof maybeVec3.y, 'number')
  equal(typeof maybeVec3.z, 'number')

  return {
    x: maybeVec3.x,
    y: maybeVec3.y,
    z: maybeVec3.z,
  }
}

export function gameUnitFrom(maybeUnit: Unit__Output): GameUnit {
  const {
    coalition,
    group,
    id,
    name,
    orientation,
    playerName,
    position,
    type,
    velocity,
  } = maybeUnit

  if (!id) {
    throw new Error('missing id on unit')
  }
  if (!coalition) {
    throw new Error('missing coalition on unit')
  }
  if (!group) {
    throw new Error('missing groupName on unit')
  }
  if (!name) {
    throw new Error('missing name on unit')
  }
  if (!orientation) {
    throw new Error('missing orientation on unit')
  }
  if (!position) {
    throw new Error('missing position on unit')
  }
  if (!type) {
    throw new Error('missing type on unit')
  }
  if (!velocity) {
    throw new Error('missing velocity on unit')
  }

  return {
    id,
    coalition,
    group: gameGroupFrom(group),
    name,
    orientation: gameOrientationFrom(orientation),
    playerName,
    position: gamePositionFrom(position),
    type,
    velocity: gameVelocityFrom(velocity),
  }
}

export function gameGroupFrom(maybeGroup: Group__Output): GameGroup {
  const { category, coalition, id, name } = maybeGroup

  if (!category) {
    throw new Error('missing category on group')
  }
  if (!coalition) {
    throw new Error('missing coalition on group')
  }
  if (!id) {
    throw new Error('missing id on group')
  }
  if (!name) {
    throw new Error('missing name on group')
  }

  return {
    category,
    coalition,
    id,
    name,
  }
}

/**
 * Returns heading in radians from a given Position3
 */
export function headingFrom(position3: GamePosition3): number {
  return Math.atan2(position3.x.z, position3.x.x)
}

export function gameOrientationFrom(
  maybeOrientation: Orientation__Output
): GameOrientation {
  const { forward, heading, pitch, right, roll, up, yaw } = maybeOrientation

  if (!forward) {
    throw new Error('expected forward on orientation')
  }
  if (!heading) {
    throw new Error('expected heading on orientation')
  }
  if (!pitch) {
    throw new Error('expected pitch on orientation')
  }
  if (!right) {
    throw new Error('expected right on orientation')
  }
  if (!roll) {
    throw new Error('expected roll on orientation')
  }
  if (!up) {
    throw new Error('expected up on orientation')
  }
  if (!yaw) {
    throw new Error('expected yaw on orientation')
  }

  return {
    forward: gameVectorFrom(forward),
    heading,
    pitch,
    right: gameVectorFrom(right),
    roll,
    up: gameVectorFrom(up),
    yaw,
  }
}

export function position3From(
  maybePosition3: Partial<GamePosition3>
): GamePosition3 {
  const { p, x, y, z } = maybePosition3

  if (!p) {
    throw new MissingPropertyError('p', 'position')
  }
  if (!x) {
    throw new MissingPropertyError('x', 'position')
  }
  if (!y) {
    throw new MissingPropertyError('y', 'position')
  }
  if (!z) {
    throw new MissingPropertyError('z', 'position')
  }

  return {
    p: gameVec3From(p),
    x: gameVec3From(x),
    y: gameVec3From(y),
    z: gameVec3From(z),
  }
}

export function gamePositionFrom(
  maybePosition: Position__Output
): GamePosition {
  const { alt, lat, lon, u, v } = maybePosition

  if (!alt) {
    throw new MissingPropertyError('alt', 'position')
  }
  if (!lat) {
    throw new MissingPropertyError('lat', 'position')
  }
  if (!lon) {
    throw new MissingPropertyError('lon', 'position')
  }
  if (!u) {
    throw new MissingPropertyError('u', 'position')
  }
  if (!v) {
    throw new MissingPropertyError('lovn', 'position')
  }

  return {
    lat,
    lon,
    alt,
    u,
    v,
  }
}
export function gamePositionLLFrom(
  maybePositionLL: Pick<Position__Output, 'alt' | 'lat' | 'lon'>
): GamePositionLL {
  const { alt, lat, lon } = maybePositionLL

  if (!alt) {
    throw new MissingPropertyError('alt', 'position')
  }
  if (!lat) {
    throw new MissingPropertyError('lat', 'position')
  }
  if (!lon) {
    throw new MissingPropertyError('lon', 'position')
  }

  return {
    lat,
    lon,
    alt,
  }
}

export function gameVectorFrom(maybeVector: Vector__Output): GameVector {
  const { x, y, z } = maybeVector

  if (!x) {
    throw new MissingPropertyError('x', 'position')
  }
  if (!y) {
    throw new MissingPropertyError('y', 'position')
  }
  if (!z) {
    throw new MissingPropertyError('z', 'position')
  }

  return { x, y, z }
}

export function gameVelocityFrom(
  maybeVelocity: Velocity__Output
): GameVelocity {
  const { heading, speed, velocity } = maybeVelocity

  if (!heading) {
    throw new MissingPropertyError('heading', 'velocity')
  }
  if (!speed) {
    throw new MissingPropertyError('speed', 'velocity')
  }
  if (!velocity) {
    throw new MissingPropertyError('velocity', 'velocity')
  }

  return {
    heading,
    speed,
    velocity: gameVectorFrom(velocity),
  }
}
