import { PositionLL, PositionMGRS, Vec2, Vec3 } from './common'
import { services } from './services'

const { custom } = services

export function vec3AreEqual(a: Vec3, b: Vec3): boolean {
  // a simple silce function. we're doing a basic equailty check so strings are fine (and faster)
  function slice(input: number): string {
    const str = input.toString()

    return str.slice(0, str.indexOf('.') + 4)
  }

  return (
    slice(a.x) === slice(b.x) &&
    slice(a.y) === slice(b.y) &&
    slice(a.z) === slice(b.z)
  )
}

export async function vector2DFrom(
  position: Pick<PositionLL, 'lat' | 'lon'>
): Promise<Vec2> {
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

export function humanReadableGridSquare(position: PositionMGRS): string {
  function firstDigit(num: number): string {
    return num.toString().slice(0, 1)
  }

  const gridSquare = position.MGRSDigraph
  const easting = firstDigit(position.Easting)
  const northing = firstDigit(position.Northing)

  return `${gridSquare}${easting}${northing}`
}

export async function positionMGRSFrom(
  position: PositionLL
): Promise<PositionMGRS> {
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
  vec: Vec2
): Promise<Pick<PositionLL, 'lat' | 'lon'>> {
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
