import { equal } from 'assert'
import { services } from './services'
import { PositionLL } from './common'

const { custom } = services

export enum RoadType {
  Roads = 'roads',
  Railroads = 'railroads',
}

export async function closestPointOnRoads(
  roadType: RoadType,
  position: PositionLL
): Promise<PositionLL> {
  const { alt, lat, lon } = position
  const lua = `
    local vec3 = coord.LLtoLO(${lat}, ${lon}, ${alt})
    local x, y = land.getClosestPointOnRoads("${roadType}", vec3.x, vec3.z)
    local alt = land.getHeight({ x = x, y = y })
    local lat, lon, alt = coord.LOtoLL({ x = x, y = alt, z = y })
    return { alt = alt, lat = lat, lon = lon }
`

  return new Promise((resolve, reject) => {
    custom.eval({ lua }, async (error, result) => {
      if (error) {
        return reject(error)
      }

      if (!result || !result.json) {
        throw new Error('missing json from result')
      }

      const position = JSON.parse(result.json) as unknown as PositionLL

      // confirm properties exist on json as a loose check
      equal('alt' in position, true)
      equal('lat' in position, true)
      equal('lon' in position, true)

      resolve(position)
    })
  })
}

export async function findPathOnRoads(
  roadType: RoadType,
  position: PositionLL, // the starting position
  destination: PositionLL // the destination position
): Promise<PositionLL[]> {
  const lua = `
    local position = coord.LLtoLO(${position.lat}, ${position.lon}, ${position.alt})
    local destination = coord.LLtoLO(${destination.lat}, ${destination.lon}, ${destination.alt})

    local pathLO = land.findPathOnRoads("${roadType}", position.x, position.z, destination.x, destination.z)
    
    if (pathLO == nil)
    then
      return nil
    end

    function map(tbl, f)
      local t = {}
      for k,v in pairs(tbl) do
        t[k] = f(v)
      end
      return t
    end

    local pathLL = map(pathLO, function(positionLO)
      local alt = land.getHeight({ x = positionLO.x, y = positionLO.y })
      local lat, lon, alt = coord.LOtoLL({ x = positionLO.x, y = alt, z = positionLO.y }) 
      return { lat = lat, lon = lon, alt = alt }
    end)

    return pathLL
`

  return new Promise((resolve, reject) => {
    custom.eval({ lua }, async (error, result) => {
      if (error) {
        return reject(error)
      }

      if (!result || !result.json) {
        throw new Error('missing json from result')
      }

      const maybePath = JSON.parse(result.json) as unknown

      if (maybePath === null) {
        return resolve([])
      }

      const path = maybePath as PositionLL[]

      equal(Array.isArray(path), true)

      path.forEach(position => {
        // confirm properties exist on json as a loose check
        equal('alt' in position, true)
        equal('lat' in position, true)
        equal('lon' in position, true)
      })

      resolve(path)
    })
  })
}
