import { GamePositionLL, GamePositionMGRS, GameVec2, GameVec3 } from './types'
import { services } from './services'

const { custom } = services

export function positionAreEqual(
  a: GamePositionLL,
  b: GamePositionLL
): boolean {
  // a simple silce function. we're doing a basic equailty check so strings are fine (and faster)
  function slice(input: number): string {
    const str = input.toString()

    // 4 decimals of precision
    return str.slice(0, str.indexOf('.') + 4)
  }

  return (
    slice(a.alt) === slice(b.alt) &&
    slice(a.lat) === slice(b.lat) &&
    slice(a.lon) === slice(b.lon)
  )
}

export function gameVec3AreEqual(a: GameVec3, b: GameVec3): boolean {
  // a simple silce function. we're doing a basic equailty check so strings are fine (and faster)
  function slice(input: number): string {
    const str = input.toString()

    // 4 decimals of precision
    return str.slice(0, str.indexOf('.') + 4)
  }

  return (
    slice(a.x) === slice(b.x) &&
    slice(a.y) === slice(b.y) &&
    slice(a.z) === slice(b.z)
  )
}

export async function vector2DFrom(
  position: Pick<GamePositionLL, 'lat' | 'lon'>
): Promise<GameVec2> {
  const { lat, lon } = position
  const lua = `
    local vec3 = coord.LLtoLO(${lat}, ${lon}, 0)
    
    return { x = vec3.x, y = vec3.z }
  `

  return new Promise((resolve, reject) => {
    custom.eval({ lua }, (error, result) => {
      if (error) {
        return reject(error)
      }

      if (typeof result === 'undefined' || typeof result.json === 'undefined') {
        return reject(new Error('missing result or result json'))
      }

      const json = JSON.parse(result.json)

      return resolve(json)
    })
  })
}

export function humanReadableGridSquare(position: GamePositionMGRS): string {
  function firstDigit(num: number): string {
    return num.toString().slice(0, 1)
  }

  const gridSquare = position.MGRSDigraph
  const easting = firstDigit(position.Easting)
  const northing = firstDigit(position.Northing)

  return `${gridSquare}${easting}${northing}`
}

export async function positionMGRSFrom(
  position: GamePositionLL
): Promise<GamePositionMGRS> {
  const { lat, lon, alt } = position
  const lua = `
    return coord.LLtoMGRS(${lat}, ${lon}, ${alt})
  `

  return new Promise((resolve, reject) => {
    custom.eval({ lua }, (error, result) => {
      if (error) {
        return reject(error)
      }

      if (typeof result === 'undefined' || typeof result.json === 'undefined') {
        return reject(new Error('missing result or result json'))
      }

      const json = JSON.parse(result.json)

      return resolve(json)
    })
  })
}

export async function positionLatLonFrom(
  vec: GameVec2
): Promise<Pick<GamePositionLL, 'lat' | 'lon'>> {
  const { x, y } = vec
  const lua = `

    local height = land.getHeight({ x = ${x}, y = ${y} })
    local lat, lon, alt = coord.LOtoLL({ x = ${x}, y = height, z = ${y} })
    
    return { lat = lat, lon = lon }
  `

  return new Promise((resolve, reject) => {
    custom.eval({ lua }, (error, result) => {
      if (error) {
        return reject(error)
      }

      if (typeof result === 'undefined' || typeof result.json === 'undefined') {
        return reject(new Error('missing result or result json'))
      }

      const json = JSON.parse(result.json)

      return resolve(json)
    })
  })
}
