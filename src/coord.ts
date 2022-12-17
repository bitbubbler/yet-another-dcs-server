import { PositionLL, Vec2 } from './common'
import { services } from './services'

const { custom } = services

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
