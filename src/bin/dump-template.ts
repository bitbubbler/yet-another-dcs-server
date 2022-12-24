import assert from 'assert'
import { PositionLL } from '../common'

import { LatLon } from '../geo'
import { Mission } from '../restartMission/types'
import { services } from '../services'
import { StaticObjectTypeName } from '../staticObject'
import { Template } from '../base-templates/types'
import { Unit, UnitTypeName } from '../unit'
import { positionLatLonFrom } from '../coord'

const { custom, hook } = services

async function main(): Promise<void> {
  await services.ready()

  const staticObjects = await getStaticObjects()

  const units = await getUnits()

  // get slots here from the mission template
  const slots = await getSlots()

  const template = templateFrom(staticObjects, units, slots)

  console.log(template)
}

interface UnitPartial extends Pick<Unit, 'typeName' | 'heading'> {
  position: Pick<PositionLL, 'lat' | 'lon'>
}

interface StaticObject {
  id: string
  typeName: string
  position: Pick<PositionLL, 'lat' | 'lon'>
  heading: number // in radians
}

function templateFrom(
  staticObjects: StaticObject[],
  units: UnitPartial[],
  slots: UnitPartial[]
): Template {
  const origin = LatLon.meanOf(
    staticObjects.map(
      object => new LatLon(object.position.lat, object.position.lon)
    )
  )
  const template: Template = {
    origin: { lat: origin.lat, lon: origin.lon },
    staticObjects: staticObjects.map(({ typeName, position, heading }) => {
      const latlon = new LatLon(position.lat, position.lon)
      const bearing =
        latlon.lat === origin.lat && latlon.lon === origin.lon
          ? 0
          : origin.initialBearingTo(latlon)
      const distance = origin.distanceTo(latlon)

      const destination = origin.destinationPoint(distance, bearing)

      try {
        assert(
          latlon.lat ===
            Number(destination.lat.toFixed(countDecimals(latlon.lat))),
          'lat should match'
        )
        assert(
          latlon.lon ===
            Number(destination.lon.toFixed(countDecimals(latlon.lon))),
          'lon should match'
        )
      } catch (error) {
        console.log(
          'useful debug info:',
          latlon,
          destination,
          bearing,
          distance
        )
        throw error
      }

      return {
        typeName: typeNameFrom(typeName),
        bearing,
        distance,
        heading,
      }
    }),
    slots: slots.map(({ typeName, position, heading }) => {
      const latlon = new LatLon(position.lat, position.lon)
      const bearing = origin.initialBearingTo(latlon)
      const distance = origin.distanceTo(latlon)

      return {
        typeName: typeName as UnitTypeName,
        bearing,
        distance,
        heading,
      }
    }),
    units: units.map(({ typeName, position, heading }) => {
      const latlon = new LatLon(position.lat, position.lon)
      const bearing = origin.initialBearingTo(latlon)
      const distance = origin.distanceTo(latlon)

      return {
        typeName: typeName as UnitTypeName,
        bearing,
        distance,
        heading,
      }
    }),
  }

  return template
}

function typeNameFrom(maybeTypeName: string): StaticObjectTypeName {
  if (maybeTypeName === StaticObjectTypeName.FarpTent) {
    return StaticObjectTypeName.FarpTent
  }
  if (maybeTypeName === StaticObjectTypeName.TowerCrane) {
    return StaticObjectTypeName.TowerCrane
  }

  throw new Error('unknown typeName')
}

async function getSlots(): Promise<UnitPartial[]> {
  const slots: UnitPartial[] = []
  const mission = await getCurrentMission()

  for (const country of mission.mission.coalition.blue.country) {
    // helicopters
    for (const group of country.helicopter.group) {
      for (const unit of group.units) {
        if (unit.skill.toLowerCase() === 'client') {
          const position = await positionLatLonFrom({ x: unit.x, y: unit.y })
          // this is a slot
          slots.push({
            heading: unit.heading,
            position,
            typeName: unit.type,
          })
        }
      }
    }
  }

  return slots
}

async function getCurrentMission(): Promise<Mission> {
  const lua = `
  return DCS.getCurrentMission()
`

  return new Promise((resolve, reject) => {
    hook.eval({ lua }, (error, result) => {
      if (error) {
        return reject(error)
      }

      if (typeof result === 'undefined' || typeof result.json === 'undefined') {
        return reject(new Error('missing result or result json'))
      }

      const json = JSON.parse(result.json)

      // type cast to a mission type
      const mission: Mission = json

      // resolve with the mission type
      resolve(mission)
    })
  })
}

async function getUnits(): Promise<UnitPartial[]> {
  const lua = `
  local units = {}

  function collectUnit(k, unit)
    local point = unit:getPoint()
    local position = unit:getPosition()
    local lat, lon, alt = coord.LOtoLL(point)
    local heading = math.atan2(position.x.z, position.x.x)

    table.insert(units, { id = unit:getID(), typeName = unit:getTypeName(), position = { lat = lat, lon = lon, alt = alt }, heading = heading })
  end

  function collectGroup(k, group)
    table.foreach(group:getUnits(), collectUnit)
  end


  table.foreach(coalition.getGroups(0), collectGroup)
  table.foreach(coalition.getGroups(1), collectGroup)
  table.foreach(coalition.getGroups(2), collectGroup)

  return units
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

      if (Array.isArray(json)) {
        return resolve(json)
      }

      return resolve([])
    })
  })
}

async function getStaticObjects(): Promise<StaticObject[]> {
  const lua = `
    local statics = {}

    function collectStatic(k, object)
      local point = object:getPoint()
      local position = object:getPosition()
      local lat, lon = coord.LOtoLL(point)
      local heading = math.atan2(position.x.z, position.x.x)

      table.insert(statics, { id = object:getID(), typeName = object:getTypeName(), position = { lat = lat, lon = lon }, heading = heading })
    end


    table.foreach(coalition.getStaticObjects(0), collectStatic)
    table.foreach(coalition.getStaticObjects(1), collectStatic)
    table.foreach(coalition.getStaticObjects(2), collectStatic)

    return statics
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

      if (Array.isArray(json)) {
        return resolve(json)
      }

      return resolve([])
    })
  })
}

main().catch(error => {
  console.log('big bad', error)
})

process.on('uncaughtException', function (err) {
  console.log(err)
})

function countDecimals(value: number): number {
  const text = value.toString()
  // verify if number 0.000005 is represented as "5e-6"
  if (text.indexOf('e-') > -1) {
    const [, trail] = text.split('e-')
    const deg = parseInt(trail, 10)
    return deg
  }
  // count decimals for number in representation like "0.123456"
  if (Math.floor(value) !== value) {
    return value.toString().split('.')[1].length || 0
  }
  return 0
}
