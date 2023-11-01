import { GamePositionLL, GameVec2, GameVec3 } from './types'

export const EARTH_RADIUS_KM = 6371

export function mod(value: number, mod: number): number {
  return value % mod
}

export function deg(radians: number): number {
  const degrees = radians * (180 / Math.PI)

  return (degrees + 360) % 360
}

export function rad(degrees: number): number {
  return degrees * (Math.PI / 180)
}

export function distanceToRad(km: number): number {
  return km / EARTH_RADIUS_KM
}

export function radToDistance(rad: number): number {
  return EARTH_RADIUS_KM * rad // kilometers
}

export function vec2From(vec3: GameVec3): GameVec2 {
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
  focus: Pick<GamePositionLL, 'lat' | 'lon'>,
  radius: number
): Pick<GamePositionLL, 'lat' | 'lon'> {
  const degreesRadius = metersToDegree(radius)
  const angle = rad(randomAngleDeg())
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
  focus: Pick<GamePositionLL, 'lat' | 'lon'>,
  radius: number
): Pick<GamePositionLL, 'lat' | 'lon'> {
  const angle = rad(randomAngleDeg())
  const lat =
    focus.lat + metersToDegree(randomBetween(-radius, radius)) * Math.cos(angle)
  const lon =
    focus.lon + metersToDegree(randomBetween(-radius, radius)) * Math.sin(angle)

  return {
    lat,
    lon,
  }
}

export function positionOnCirlce(
  focus: Pick<GamePositionLL, 'lat' | 'lon'>,
  radius: number, // radius in meters
  angle: number
) {
  const course = rad(angle)

  const lat = focus.lat + metersToDegree(radius) * Math.cos(course)
  const lon = focus.lon + metersToDegree(radius) * Math.sin(course)

  return {
    lat,
    lon,
  }
}

export async function waitForTime(ms?: number | undefined): Promise<void> {
  return new Promise(resolve => {
    // TODO: timeouts can be canceled/cleared. Right now this has potential for a memory leak
    // if this timeout is canceled/cleared this promise chain will be left unresolve and unrejected.
    setTimeout(() => resolve(), ms)
  })
}
