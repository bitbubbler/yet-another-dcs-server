import { LatLon } from './geo'
import { Coalition } from '../generated/dcs/common/v0/Coalition'
import { baseNames } from './baseNames'
import { PositionLL, randomBetween } from './common'
import { countryFrom } from './country'
import { insertBase, knex, nearbyBases } from './db'
import { createStaticObject, StaticObject } from './staticObject'
import {
  baseLevel0,
  baseLevel1,
  baseLevel2,
  baseLevel3,
  Template,
} from './base-templates'
import { insertBaseStaticObject } from './db/baseStaticObjects'
import assert from 'assert'

/** Min range between COP bases in meters */
const BASE_COP_MIN_RANGE = 10000
/** Min range between FARP bases in meters */
const BASE_FARP_MIN_RANGE = 15000
/** Min range between FOB bases in meters */
const BASE_FOB_MIN_RANGE = 20000

// assert an assumption that below code makes to simplify the solution of validating base distances.
// we can remove this requirement in the future, so long as we also remove the assumption in below code.
assert(
  BASE_COP_MIN_RANGE < BASE_FARP_MIN_RANGE &&
    BASE_FARP_MIN_RANGE < BASE_FOB_MIN_RANGE,
  'BASE MIN VALUES SHOULD INCREASE IN DISTANCE AS BASE SIZE INCREASES'
)

export enum BaseType {
  /**
   * Under Construction (new base being created)
   * - no cargo
   * - no lives
   */
  UnderConstruction,
  /**
   * Main operating base (MOB)
   * - more spawn points
   */
  MOB,
  /**
   * Forward operating base (FOB)
   * - spawn points
   */
  FOB,
  /**
   * Forward arming and refueling point (FARP)
   * NOTE: only for arming and refueling
   * - no spawning here
   */
  FARP,
  /**
   * Combat outpost (COP)
   * - troops only (no cargo pickups here')
   * - no spawning here
   */
  COP,
}

export type NewBase = Pick<Base, 'coalition' | 'heading' | 'position' | 'type'>

export interface Base {
  baseId: number
  coalition: Coalition
  /** heading in radians */
  heading: number
  name: string
  position: Pick<PositionLL, 'lat' | 'lon'>
  type: BaseType
}

export async function createBase(newBase: NewBase): Promise<Base> {
  const name = await uniqueBaseName()

  const base = insertBase({
    ...newBase,
    name,
  })

  return base
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

export function baseTemplateFrom(base: Base): Template {
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

/**
 * A function to compare existing base positions to determine if a base of given type can exist at given position
 * This function, therefore, exists to answer the question "is this a valid base".
 * */
export async function validateBase(
  base: Pick<Base, 'position' | 'type'>
): Promise<{ valid: true } | { valid: false; reason: string }> {
  // TODO: exclude the given baseId from the lookups of nearby bases
  if (BaseType.UnderConstruction === base.type) {
    const existingNearbyBases = await nearbyBases({
      position: base.position,
      accuracy: BASE_COP_MIN_RANGE,
    })

    if (existingNearbyBases.length > 0) {
      return {
        valid: false,
        reason: `Newly Constructed bases may only be created ${BASE_COP_MIN_RANGE} from any other base type`,
      }
    }

    return { valid: true }
  }
  if (BaseType.COP === base.type) {
    const existingNearbyBases = await nearbyBases({
      position: base.position,
      accuracy: BASE_COP_MIN_RANGE,
    })

    if (existingNearbyBases.length > 0) {
      return {
        valid: false,
        reason: `COP base may only be created ${BASE_COP_MIN_RANGE} from any other base type`,
      }
    }

    return { valid: true }
  }
  if (BaseType.FARP === base.type) {
    const existingNearbyFARPRangeBases = await nearbyBases({
      position: base.position,
      accuracy: BASE_FARP_MIN_RANGE,
    })
    const existingNearbyCOPRangeBases = await nearbyBases({
      position: base.position,
      accuracy: BASE_COP_MIN_RANGE,
    })

    const existingNearbyEqualOrGreaterBases =
      existingNearbyFARPRangeBases.filter(base =>
        [BaseType.FARP, BaseType.FOB, BaseType.MOB].includes(base.type)
      )

    const existingNearbyLesserBases = existingNearbyCOPRangeBases.filter(base =>
      [BaseType.COP].includes(base.type)
    )

    if (existingNearbyEqualOrGreaterBases.length > 0) {
      return {
        valid: false,
        reason: `FARP base may only be created ${BASE_FARP_MIN_RANGE} from any other FARP or larger base`,
      }
    }

    if (existingNearbyLesserBases.length > 0) {
      return {
        valid: false,
        reason: `FARP base may only be created ${BASE_COP_MIN_RANGE} from any other COP base`,
      }
    }

    return { valid: true }
  }
  if (BaseType.FOB === base.type) {
    const existingNearbyFOBRangeBases = await nearbyBases({
      position: base.position,
      accuracy: BASE_FOB_MIN_RANGE,
    })
    const existingNearbyFARPRangeBases = await nearbyBases({
      position: base.position,
      accuracy: BASE_FARP_MIN_RANGE,
    })

    const existingNearbyEqualOrGreaterBases =
      existingNearbyFOBRangeBases.filter(base =>
        [BaseType.FOB, BaseType.MOB].includes(base.type)
      )

    const existingNearbyLesserBases = existingNearbyFARPRangeBases.filter(
      base => [BaseType.FARP, BaseType.COP].includes(base.type)
    )

    if (existingNearbyEqualOrGreaterBases.length > 0) {
      return {
        valid: false,
        reason: `FOB base may only be created ${BASE_FOB_MIN_RANGE} from any other FOB or larger base`,
      }
    }

    if (existingNearbyLesserBases.length > 0) {
      return {
        valid: false,
        reason: `FOB base may only be created ${BASE_FARP_MIN_RANGE} from any other FARM or smaller base`,
      }
    }

    return { valid: true }
  }
  // TODO: handle MOB

  throw new Error(`Unknown BaseType ${base.type} attemting to validateBase`)
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
