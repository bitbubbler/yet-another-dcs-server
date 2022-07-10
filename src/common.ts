import { equal } from 'assert'
import { Position } from '../generated/dcs/common/v0/Position'
import { Position3, PositionLL, Vec2, Vec3 } from './types'

export function deg(radians: number): number {
  return radians * (180 / Math.PI)
}

export function rad(degrees: number): number {
  return degrees * (Math.PI / 180)
}

export function vec2From(vec3: Vec3): Vec2 {
  return {
    x: vec3.x,
    y: vec3.z,
  }
}

/**
 *
 * @param meter distance in meters
 * @returns distance in lat/lon degress (roughly)
 */
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

export function randomBetween(start: number, end: number): number {
  return Math.floor(Math.random() * (end - start + 1) + start)
}

/**
 *
 * @param position center of the circle
 * @param radius radius of the circle in meters
 * @returns a random position on the outside ring of the circle
 */
export function randomPositionOnCircle(
  focus: Pick<PositionLL, 'lat' | 'lon'>,
  radius: number
): Pick<PositionLL, 'lat' | 'lon'> {
  const degreesRadius = metersToDegree(radius)
  const angle = randomAngleDeg()
  const lat = focus.lat + degreesRadius * Math.cos(angle)
  const lon = focus.lon + degreesRadius * Math.sin(angle)

  return {
    lat,
    lon,
  }
}

/**
 *
 * @param position center of the circle
 * @param radius radius of the circle in meters
 * @returns a random position somewhere within the circle
 */
export function randomPositionInCircle(
  focus: Pick<PositionLL, 'lat' | 'lon'>,
  radius: number
): Pick<PositionLL, 'lat' | 'lon'> {
  const angle = randomAngleDeg()
  const lat =
    focus.lat + metersToDegree(randomBetween(-radius, radius)) * Math.cos(angle)
  const lon =
    focus.lon + metersToDegree(randomBetween(-radius, radius)) * Math.sin(angle)

  return {
    lat,
    lon,
  }
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

export function positionLLFrom(maybePositionLL: Position): PositionLL {
  if (
    'lat' in maybePositionLL === false ||
    typeof maybePositionLL.lat !== 'number'
  ) {
    throw new Error('expected lat to be a number')
  }
  if (
    'lon' in maybePositionLL === false ||
    typeof maybePositionLL.lon !== 'number'
  ) {
    throw new Error('expected lon to be a number')
  }
  if (
    'alt' in maybePositionLL === false ||
    typeof maybePositionLL.alt !== 'number'
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
