import { LatLon } from './geo'
import { Coalition } from '../generated/dcs/common/v0/Coalition'
import { baseNames } from './baseNames'
import { PositionLL, randomBetween } from './common'
import { countryFrom } from './country'
import { insertBase, knex } from './db'
import { createStaticObject, StaticObject } from './staticObject'
import {
  baseLevel0,
  baseLevel1,
  baseLevel2,
  baseLevel3,
  Template,
} from './templates'
import { insertBaseStaticObject } from './db/baseStaticObjects'

export enum BaseType {
  /**
   * Under Construction (new base being created)
   * - no cargo
   * - no lives
   */
  UnderConstruction,
  /**
   * Main operating base (MOB)
   * - unlimited cargo
   * - unlimited lives
   */
  MOB,
  /**
   * Forward operating base (FOB)
   * - limited cargo
   * - limited lives
   */
  FOB,
  /**
   * Forward arming and refueling point (FARP)
   * NOTE: only for arming and refueling
   * - no cargo
   * - no lives (no spawning here)
   */
  FARP,
  /**
   * Combat outpost (COP)
   * - limited cargo (troops only)
   * - no lives (no spawning here)
   */
  COP,
}

export interface Base {
  baseId: number
  coalition: Coalition
  /** heading in radians */
  heading: number
  name: string
  position: Pick<PositionLL, 'lat' | 'lon'>
  type: BaseType
}

export async function createBase(
  newBase: Pick<Base, 'coalition' | 'heading' | 'position' | 'type'>
): Promise<Base> {
  const name = await uniqueBaseName()

  const base = insertBase({
    ...newBase,
    name,
  })

  return base
}

export async function upgradeBase(base: Base): Promise<void> {
  // find existing staticObjects and units that belong to this base
  // despawn existing static objects and units
  // destroy existing static objects and units
}

export async function createBaseStaticObjects(
  base: Base
): Promise<StaticObject[]> {
  // use base level to determine template
  const template = baseTemplateFrom(base)

  // collection of StaticObject(s) to return
  const staticObjects: StaticObject[] = []

  // create and spawn static objects for template
  for (const staticObjectTemplate of template.staticObjects) {
    const { bearing, distance, heading, typeName } = staticObjectTemplate

    // determine where this static object should be
    const { lat, lon } = new LatLon(
      base.position.lat,
      base.position.lon
    ).destinationPoint(distance, bearing)

    // create the static object
    const staticObject = await createStaticObject({
      country: countryFrom(base.coalition),
      heading,
      position: { lat, lon },
      typeName,
    })

    // assign this static as belonging to this base
    await insertBaseStaticObject(base.baseId, staticObject.staticObjectId)

    // keep track of it to return
    staticObjects.push(staticObject)
  }

  return staticObjects
}

function baseTemplateFrom(base: Base): Template {
  if (BaseType.UnderConstruction === base.type) {
    return baseLevel0
  }
  if (BaseType.COP === base.type) {
    return baseLevel1
  }
  if (BaseType.FARP === base.type) {
    return baseLevel2
  }
  if (BaseType.FOB === base.type) {
    return baseLevel3
  }

  throw new Error(`Missing template for given base type ${base.type}`)
}

export async function uniqueBaseName(): Promise<string> {
  const name = `spawned base ${
    baseNames[randomBetween(0, baseNames.length - 1)]
  }`

  // check that the name is not already in use
  const existingbase = await knex('bases')
    .select('baseId')
    .where({ name })
    .first()

  // if the name is alredy in use
  if (existingbase) {
    // try again
    return uniqueBaseName()
  }

  // otherwise return this name
  return name
}

/** A funtion to return the next base type if upgraded */
export function nextBaseTypeFrom(baseType: BaseType): BaseType | undefined {
  if (BaseType.UnderConstruction === baseType) {
    return BaseType.COP
  }
  if (BaseType.COP === baseType) {
    return BaseType.FARP
  }
  if (BaseType.FARP === baseType) {
    return BaseType.FOB
  }
  if (BaseType.FOB === baseType) {
    // TODO: implement MOB(s)
  }

  // no upgrades for this types
  return undefined
}

export function baseTypeDisplayName(baseType: BaseType): string {
  if (BaseType.UnderConstruction === baseType) {
    return 'Under Construction'
  }
  if (BaseType.COP === baseType) {
    return 'Combat Outpost'
  }
  if (BaseType.FARP === baseType) {
    return 'Forward Arming and Refueling Point'
  }
  if (BaseType.FOB === baseType) {
    return 'Forward Operating Base'
  }
  if (BaseType.MOB === baseType) {
    return 'Main Operating Base'
  }

  throw new Error('unknown BaseType')
}
