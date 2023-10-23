// db must be the first import
import { orm } from '../db/connection.mjs'

// just hold a reference here (i promise, this fixes a bug)
const db = orm

import { Position, StaticObjectTypeName, Unit, UnitTypeName } from '../db'

import assert from 'assert'
import { PositionLL } from '../common'

import { LatLon } from '../geo'
import { Mission } from '../restartMission/types'
import { services } from '../services'
import { Template } from '../base-templates/types'
import { positionLatLonFrom } from '../coord'

const { custom, hook } = services

async function main(): Promise<void> {
  await services.ready()

  const staticObjects = await getStaticObjects()

  const units = await getUnits()

  // get slots here from the mission template
  const slots = await getSlots()

  const template = templateFrom(staticObjects, units, slots)

  // TODO: fix serialization
  console.log(serialize(template))
}

interface UnitPartial
  extends Pick<Unit, 'typeName'>,
    Pick<Position, 'heading'> {
  position: Pick<Position, 'lat' | 'lon'>
}

interface StaticObject {
  id: string
  typeName: string
  position: Pick<PositionLL, 'lat' | 'lon'>
  heading: number // in radians
}

type Json = string | number | boolean | Json[] | { [key: string]: Json }

function serialize(template: Template): Json {
  const serialized: Json = {
    origin: template.origin,
    slots: [],
    staticObjects: [],
    units: [],
  }

  for (const staticObject of template.staticObjects) {
    ;(serialized.staticObjects as Array<Json>).push({
      ...staticObject,
      typeName: staticObjectTypeNameStringFrom(staticObject.typeName),
    })
  }
  for (const slots of template.slots) {
    ;(serialized.units as Array<Json>).push({
      ...slots,
      typeName: unitTypeNameStringFrom(slots.typeName),
    })
  }
  for (const unit of template.units) {
    ;(serialized.units as Array<Json>).push({
      ...unit,
      typeName: unitTypeNameStringFrom(unit.typeName),
    })
  }

  return serialized
}

function templateFrom(
  staticObjects: StaticObject[],
  units: UnitPartial[],
  slots: UnitPartial[]
): Template {
  // use the geographical center of all template items as the origin
  const origin = LatLon.meanOf(
    [...slots, ...staticObjects, ...units].map(
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
        typeName: typeName as StaticObjectTypeName,
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

function unitTypeNameStringFrom(maybeTypeName: string): string {
  if (maybeTypeName === UnitTypeName.AH64D) {
    return `UnitTypeName.AH64D`
  }
  if (maybeTypeName === UnitTypeName.UH1H) {
    return `UnitTypeName.UH1H`
  }
  if (maybeTypeName === UnitTypeName.UH60) {
    return `UnitTypeName.UH60`
  }
  if (maybeTypeName === UnitTypeName.MI24) {
    return `UnitTypeName.MI24`
  }
  if (maybeTypeName === UnitTypeName.MI8) {
    return `UnitTypeName.MI8`
  }
  if (maybeTypeName === UnitTypeName.M818) {
    return `UnitTypeName.M818`
  }
  if (maybeTypeName === UnitTypeName.M978) {
    return `UnitTypeName.M978`
  }
  if (maybeTypeName === UnitTypeName.KA50) {
    return `UnitTypeName.KA50`
  }
  if (maybeTypeName === UnitTypeName.KA503) {
    return `UnitTypeName.KA503`
  }
  if (maybeTypeName === UnitTypeName.SA342L) {
    return `UnitTypeName.SA342L`
  }
  if (maybeTypeName === UnitTypeName.SA342M) {
    return `UnitTypeName.SA342M`
  }
  if (maybeTypeName === UnitTypeName.SA342Minigun) {
    return `UnitTypeName.SA342Minigun`
  }
  if (maybeTypeName === UnitTypeName.SA342Mistral) {
    return `UnitTypeName.SA342Mistral`
  }

  debugger

  throw new Error('unknown unit typeName')
}

function staticObjectTypeNameStringFrom(maybeTypeName: string): string {
  if (maybeTypeName === StaticObjectTypeName.FarpTent) {
    return `StaticObjectTypeName.FarpTent`
  }
  if (maybeTypeName === StaticObjectTypeName.TowerCrane) {
    return `StaticObjectTypeName.TowerCrane`
  }
  if (maybeTypeName === StaticObjectTypeName.CommsTowerM) {
    return `StaticObjectTypeName.CommsTowerM`
  }
  if (maybeTypeName === StaticObjectTypeName.M1126StrykerICV) {
    return `StaticObjectTypeName.M1126StrykerICV`
  }
  if (maybeTypeName === StaticObjectTypeName.Hummer) {
    return `StaticObjectTypeName.Hummer`
  }
  if (maybeTypeName === StaticObjectTypeName.PatriotAMG) {
    return `StaticObjectTypeName.PatriotAMG`
  }
  if (maybeTypeName === StaticObjectTypeName.ContainerCargo) {
    return `StaticObjectTypeName.ContainerCargo`
  }
  if (maybeTypeName === StaticObjectTypeName.GeneratorF) {
    return `StaticObjectTypeName.GeneratorF`
  }
  if (maybeTypeName === StaticObjectTypeName.FarpAmmoDumpCoating) {
    return `StaticObjectTypeName.FarpAmmoDumpCoating`
  }
  if (maybeTypeName === StaticObjectTypeName.Windsock) {
    return `StaticObjectTypeName.Windsock`
  }
  if (maybeTypeName === StaticObjectTypeName.FarpFuelDepot) {
    return `StaticObjectTypeName.FarpFuelDepot`
  }
  if (maybeTypeName === StaticObjectTypeName.ShelterB) {
    return `StaticObjectTypeName.ShelterB`
  }
  if (maybeTypeName === StaticObjectTypeName.MLRSFDDM) {
    return `StaticObjectTypeName.MLRSFDDM`
  }
  if (maybeTypeName === StaticObjectTypeName.House2Arm) {
    return `StaticObjectTypeName.House2Arm`
  }
  if (maybeTypeName === StaticObjectTypeName.FBarCargo) {
    return `StaticObjectTypeName.FBarCargo`
  }
  if (maybeTypeName === StaticObjectTypeName.SoldierM4) {
    return `StaticObjectTypeName.SoldierM4`
  }
  if (maybeTypeName === StaticObjectTypeName.AmmoCargo) {
    return `StaticObjectTypeName.AmmoCargo`
  }
  if (maybeTypeName === StaticObjectTypeName.UH1HCargo) {
    return `StaticObjectTypeName.UH1HCargo`
  }
  if (maybeTypeName === StaticObjectTypeName.HangerA) {
    return `StaticObjectTypeName.HangerA`
  }
  if (maybeTypeName === StaticObjectTypeName.CV59NS60) {
    return `StaticObjectTypeName.CV59NS60`
  }
  if (maybeTypeName === StaticObjectTypeName.SoldierM4GRG) {
    return `StaticObjectTypeName.SoldierM4GRG`
  }
  if (maybeTypeName === StaticObjectTypeName.TACANBeacon) {
    return `StaticObjectTypeName.TACANBeacon`
  }
  if (maybeTypeName === StaticObjectTypeName.ISOContainer) {
    return `StaticObjectTypeName.ISOContainer`
  }
  if (maybeTypeName === StaticObjectTypeName.PatriotEPP) {
    return `StaticObjectTypeName.PatriotEPP`
  }
  if (maybeTypeName === StaticObjectTypeName.PatriotEPP) {
    return `StaticObjectTypeName.PatriotEPP`
  }
  if (maybeTypeName === StaticObjectTypeName.M818) {
    return `StaticObjectTypeName.M818`
  }

  debugger

  throw new Error('unknown typeName')
}

async function getSlots(): Promise<UnitPartial[]> {
  const slots: UnitPartial[] = []
  const mission = await getCurrentMission()

  for (const country of mission.mission.coalition.blue.country) {
    // helicopters
    if (country.helicopter) {
      for (const group of country.helicopter.group) {
        for (const unit of group.units) {
          if (unit.skill.toLowerCase() === 'client') {
            const position = await positionLatLonFrom({ x: unit.x, y: unit.y })
            // this is a slot
            slots.push({
              heading: unit.heading,
              position,
              typeName: unit.type as UnitTypeName,
            })
          }
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
