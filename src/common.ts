import { equal } from 'assert'
import { Position__Output } from '../generated/dcs/common/v0/Position'
import { Position3, PositionLL, Vec3 } from './types'

export function deg(radians: number): number {
  return radians * (180 / Math.PI)
}

export function rad(degrees: number): number {
  return degrees * (Math.PI / 180)
}

export function metersToDegree(meter: number): number {
  // magic number
  // https://gis.stackexchange.com/questions/2951/algorithm-for-offsetting-a-latitude-longitude-by-some-amount-of-meters
  return meter / 111111
}

/**
 * @returns a random floating point angle in radians
 */
export function randomAngleRad(): number {
  return 2 * Math.PI * Math.random()
}

/**
 * @returns a random floating point angle in degrees
 */
export function randomAngleDeg(): number {
  return 360 * Math.random()
}

/**
 * Returns a distance in meters given two PositionLL
 * @param positiona PositionLL
 * @param positionb PositionLL
 */
export function distanceFrom(a: PositionLL, b: PositionLL): number {
  return Math.sqrt(Math.pow(a.lat - b.lat, 2) + Math.pow(a.lon - b.lon, 2))
}

export function vec3From(maybeVec3: Partial<Vec3>): Vec3 {
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

export function position3From(maybePosition3: Partial<Position3>): Position3 {
  if (
    'p' in maybePosition3 === false ||
    typeof maybePosition3.p === 'undefined'
  ) {
    throw new Error('expected p to be a Vec3')
  }
  if (
    'x' in maybePosition3 === false ||
    typeof maybePosition3.x === 'undefined'
  ) {
    throw new Error('expected x to be a Vec3')
  }
  if (
    'y' in maybePosition3 === false ||
    typeof maybePosition3.y === 'undefined'
  ) {
    throw new Error('expected y to be a Vec3')
  }
  if (
    'z' in maybePosition3 === false ||
    typeof maybePosition3.z === 'undefined'
  ) {
    throw new Error('expected z to be a Vec3')
  }

  equal(typeof maybePosition3.p, 'object')
  equal(typeof maybePosition3.x, 'object')
  equal(typeof maybePosition3.y, 'object')
  equal(typeof maybePosition3.z, 'object')

  return {
    p: vec3From(maybePosition3.p),
    x: vec3From(maybePosition3.x),
    y: vec3From(maybePosition3.y),
    z: vec3From(maybePosition3.z),
  }
}

export function positionLLFrom(maybePositionLL: Position__Output): PositionLL {
  if (
    'lat' in maybePositionLL === false ||
    typeof maybePositionLL.lat === 'undefined'
  ) {
    throw new Error('expected lat to be a number')
  }
  if (
    'lon' in maybePositionLL === false ||
    typeof maybePositionLL.lon === 'undefined'
  ) {
    throw new Error('expected lon to be a number')
  }
  if (
    'alt' in maybePositionLL === false ||
    typeof maybePositionLL.alt === 'undefined'
  ) {
    throw new Error('expected alt to be a number')
  }

  equal(typeof maybePositionLL.lat, 'number')
  equal(typeof maybePositionLL.lon, 'number')
  equal(typeof maybePositionLL.alt, 'number')

  return {
    lat: maybePositionLL.lat,
    lon: maybePositionLL.lon,
    alt: maybePositionLL.alt,
  }
}
