import everyObject from '../everyobject.json'

export interface EveryObject {
  weapons?: { desc: unknown }[]
  sensors?: {
    [key: string]: { typeName: string; type: number; opticType: number }
  }[]
  desc?: {
    attributes: {
      'Armed vehicles'?: true
      All?: true
      APC?: true
      'Ground Units'?: true
      'AntiAir Armed Vehicles'?: true
      'Infantry carriers'?: true
      NonAndLightArmoredUnits?: true
      'Ground vehicles'?: true
      LightArmoredUnits?: true
      'Armed ground units'?: true
      Vehicles?: true
      'Ground Units Non Airdefence'?: true
      'Armored vehicles'?: true
    }
    typeName: string
    displayName: string
  }
}

export const GROUND_UNITS = new Map<string, EveryObject>()
export const AIR_DEFENCE = new Map<string, EveryObject>()
export const FORTIFICATIONS = new Map<string, EveryObject>()

export const TANKS = new Map<string, EveryObject>()
export const IFV = new Map<string, EveryObject>()
export const INFANTRY = new Map<string, EveryObject>()
export const MLRS = new Map<string, EveryObject>()
export const ARTILLERY = new Map<string, EveryObject>()
export const TRUCKS = new Map<string, EveryObject>()

export const HELICOPTERS = new Map<string, EveryObject>()
export const AIRCRAFT = new Map<string, EveryObject>()
export const SHIPS = new Map<string, EveryObject>()
export const CARGOS = new Map<string, EveryObject>()

export const WW2_ASSETS = new Map<string, EveryObject>()

// classifications: https://github.com/mrSkortch/DCS-miscScripts/blob/dded70eb829ded86974e892d1c76d24b5082a051/ObjectDB/writeCountries.lua#L98-L137
Object.keys(everyObject).forEach(key => {
  const data = everyObject[key]
  if ('attributes' in data.desc === false) {
    // TODO: fiure out how to classify these
    // or if we care about them
    return
  }
  const attributes = Object.keys(data.desc.attributes)

  if (attributes.includes('Ground Units')) {
    if (attributes.includes('Air Defence')) {
      AIR_DEFENCE.set(key, data)
    } else if (attributes.includes('Fortifications')) {
      FORTIFICATIONS.set(key, data)
    } else {
      GROUND_UNITS.set(key, data)
      if (attributes.includes('Tanks')) {
        TANKS.set(key, data)
      } else if (attributes.includes('IFV')) {
        IFV.set(key, data)
      } else if (attributes.includes('APC')) {
        IFV.set(key, data)
      } else if (attributes.includes('Infantry')) {
        INFANTRY.set(key, data)
      } else if (attributes.includes('MLRS')) {
        MLRS.set(key, data)
      } else if (attributes.includes('Artillery')) {
        ARTILLERY.set(key, data)
      } else if (attributes.includes('Trucks')) {
        TRUCKS.set(key, data)
      }
    }
  } else if (attributes.includes('Helicopters')) {
    HELICOPTERS.set(key, data)
  } else if (attributes.includes('Planes')) {
    AIRCRAFT.set(key, data)
  } else if (attributes.includes('Ships')) {
    SHIPS.set(key, data)
  } else if (attributes.includes('Cargos')) {
    CARGOS.set(key, data)
  }
})
