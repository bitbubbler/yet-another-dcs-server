import { LatLon } from './geo'
import { baseNames } from './baseNames'
import { distanceFrom, metersToDegree, randomBetween } from './common'
import { countryFrom } from './country'
import { despawnStaticObject, spawnStaticObject } from './staticObject'
import {
  baseLevel0,
  baseLevel1,
  baseLevel2,
  baseLevel3,
  Template,
} from './base-templates'
import assert from 'assert'
import { createUnit, despawnGroundUnit, spawnGroundUnit } from './unit'
import { despawnFarp, spawnFarp } from './farp'
import { entityManager, orm } from './db/db'
import {
  Base,
  BaseType,
  NewBase,
  Position,
  StaticObject,
  TextMarkup,
  Color,
} from './db'
import { Coalition } from './__generated__/dcs/common/v0/Coalition'
import { wrap } from '@mikro-orm/core'
import { spawnMarkup } from './markup'

/** Min range between COP bases in meters */
const BASE_COP_MIN_RANGE_METERS = 3500
/** Min range between FARP bases in meters */
const BASE_FARP_MIN_RANGE_METERS = 7000
/** Min range between FOB bases in meters */
const BASE_FOB_MIN_RANGE_METERS = 10000

// assert an assumption that below code makes to simplify the solution of validating base distances.
// we can remove this requirement in the future, so long as we also remove the assumption in below code.
assert(
  BASE_COP_MIN_RANGE_METERS < BASE_FARP_MIN_RANGE_METERS &&
    BASE_FARP_MIN_RANGE_METERS < BASE_FOB_MIN_RANGE_METERS,
  'BASE MIN VALUES SHOULD INCREASE IN DISTANCE AS BASE SIZE INCREASES'
)

export async function createBase(
  newBase: Omit<NewBase, 'name' | 'labelMarkup'>
): Promise<Base> {
  const name = await uniqueBaseName()
  const { coalition, position } = newBase

  // determine where the label should be, using the base position
  const { lat, lon } = new LatLon(position.lat, position.lon)
    .destinationPoint(250, 90)
    .destinationPoint(100, 0)

  const labelPosition = new Position({ lat, lon, alt: 0, heading: 0 })

  const labelMarkup = new TextMarkup({
    coalition,
    fillColor: new Color({ red: 0, green: 0, blue: 0, alpha: 0 }),
    fontSize: 16,
    lineColor: new Color({ red: 0, green: 0, blue: 0, alpha: 1 }),
    position: labelPosition,
    readonly: true,
    text: `
Friendly Base:
Type: ${baseTypeDisplayNameShort(newBase.type)}
Name: ${name}`.trim(), // use trim to remove leading and trailing whitespace/newlines
  })

  const base = new Base({ ...newBase, labelMarkup, name })

  await entityManager(await orm)
    .persist(base)
    .flush()

  return base
}

export async function baseGone(base: Base): Promise<void> {
  // set the base goneAt
  base.goneAt = new Date()

  // flush the changes
  await entityManager(await orm)
    .persist(base)
    .flush()
}

export async function allBases(): Promise<Base[]> {
  return entityManager(await orm).find(Base, {})
}

async function createBaseObjects(base: Base): Promise<void> {
  const em = entityManager(await orm)
  // use base level to determine template
  const template = baseTemplateFrom(base)

  // create and spawn static objects for template
  for (const staticObjectTemplate of template.staticObjects) {
    const { bearing, distance, heading, typeName } = staticObjectTemplate

    // determine where this static object should be
    const { lat, lon } = new LatLon(
      base.position.lat,
      base.position.lon
    ).destinationPoint(distance, bearing)
    const position = new Position({ lat, lon, heading, alt: 0 })
    // create the static object
    const staticObject = new StaticObject({
      country: countryFrom(base.coalition),
      position,
      typeName,
    })

    base.staticObjects.add(staticObject)
  }

  // flush everything to the db
  await em.persistAndFlush(base)
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
  const em = entityManager(await orm)
  const baseRepository = em.getRepository(Base)

  const name = baseNames[randomBetween(0, baseNames.length - 1)]

  // check that the name is not already in use
  const existingbase = await baseRepository.findOne({ name })

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
  base: Pick<Base, 'coalition' | 'position' | 'type'> &
    Partial<Pick<Base, 'baseId'>>
): Promise<{ valid: true } | { valid: false; reason: string }> {
  const { coalition, position, type } = base

  function excludeThisBase(baseToCheck: Base) {
    if (base.baseId) {
      return baseToCheck.baseId !== base.baseId
    }
    return true
  }

  // TODO: exclude the given baseId from the lookups of nearby bases
  if (BaseType.UnderConstruction === type) {
    const existingNearbyBases = (
      await findNearbyBases({
        accuracy: BASE_COP_MIN_RANGE_METERS,
        coalition,
        position,
      })
    ).filter(excludeThisBase)

    if (existingNearbyBases.length > 0) {
      return {
        valid: false,
        reason: `Newly Constructed bases may only be created ${BASE_COP_MIN_RANGE_METERS} meters from any other base type`,
      }
    }

    return { valid: true }
  }
  if (BaseType.COP === type) {
    const existingNearbyBases = (
      await findNearbyBases({
        accuracy: BASE_COP_MIN_RANGE_METERS,
        coalition,
        position,
      })
    ).filter(excludeThisBase)

    if (existingNearbyBases.length > 0) {
      return {
        valid: false,
        reason: `COP base may only be created ${BASE_COP_MIN_RANGE_METERS} meters from any other base type`,
      }
    }

    return { valid: true }
  }
  if (BaseType.FARP === type) {
    const existingNearbyFARPRangeBases = (
      await findNearbyBases({
        accuracy: BASE_FARP_MIN_RANGE_METERS,
        coalition,
        position,
      })
    ).filter(excludeThisBase)
    const existingNearbyCOPRangeBases = (
      await findNearbyBases({
        accuracy: BASE_COP_MIN_RANGE_METERS,
        coalition,
        position,
      })
    ).filter(excludeThisBase)

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
        reason: `FARP base may only be created ${BASE_FARP_MIN_RANGE_METERS} meters from any other FARP or larger base`,
      }
    }

    if (existingNearbyLesserBases.length > 0) {
      return {
        valid: false,
        reason: `FARP base may only be created ${BASE_COP_MIN_RANGE_METERS} meters from any other COP base`,
      }
    }

    return { valid: true }
  }
  if (BaseType.FOB === type) {
    const existingNearbyFOBRangeBases = (
      await findNearbyBases({
        accuracy: BASE_FOB_MIN_RANGE_METERS,
        coalition,
        position,
      })
    ).filter(excludeThisBase)
    const existingNearbyFARPRangeBases = (
      await findNearbyBases({
        accuracy: BASE_FARP_MIN_RANGE_METERS,
        coalition,
        position,
      })
    ).filter(excludeThisBase)

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
        reason: `FOB base may only be created ${BASE_FOB_MIN_RANGE_METERS} meters from any other FOB or larger base`,
      }
    }

    if (existingNearbyLesserBases.length > 0) {
      return {
        valid: false,
        reason: `FOB base may only be created ${BASE_FARP_MIN_RANGE_METERS} meters from any other FARM or smaller base`,
      }
    }

    return { valid: true }
  }
  // TODO: handle MOB

  throw new Error(`Unknown BaseType ${type} attemting to validateBase`)
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

export function baseTypeDisplayNameShort(baseType: BaseType): string {
  if (BaseType.UnderConstruction === baseType) {
    return 'UC'
  }
  if (BaseType.COP === baseType) {
    return 'COP'
  }
  if (BaseType.FARP === baseType) {
    return 'FARP'
  }
  if (BaseType.FOB === baseType) {
    return 'FOB'
  }
  if (BaseType.MOB === baseType) {
    return 'MOB'
  }

  return baseType
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

  return baseType
}

async function createBaseUnits(base: Base): Promise<void> {
  const em = entityManager(await orm)

  // use base level to determine template
  const template = baseTemplateFrom(base)

  // create and spawn units for template
  for (const unitTemplate of template.units) {
    const { bearing, distance, heading, typeName } = unitTemplate

    // determine where this static object should be
    const { lat, lon } = new LatLon(
      base.position.lat,
      base.position.lon
    ).destinationPoint(distance, bearing)

    const position = new Position({
      lat,
      lon,
      alt: 0,
      heading,
    })

    // create the unit
    const unit = await createUnit({
      country: countryFrom(base.coalition),
      hidden: true,
      position,
      typeName: typeName,
      isPlayerSlot: false,
    })

    base.units.add(unit)
  }

  await em.persistAndFlush(base)
}

export async function spawnBase(base: Base): Promise<void> {
  const { baseId, coalition, name, position, type } = base

  await spawnFarp({
    name: `${baseTypeDisplayName(type)} ${name}`,
    groupId: baseId,
    country: countryFrom(coalition),
    position: position,
    type: 'Invisible FARP',
  })

  // make sure we have a labelMarkup to spawn
  await wrap(base.labelMarkup).init()

  await spawnMarkup(base.labelMarkup)

  await spawnBaseUnitsAndObjects(base)
}

export async function despawnBase(base: Base): Promise<void> {
  await despawnFarp()
  await destroyAndDespawnBaseUnitsAndObject(base)
}

export async function createBaseUnitsAndObjects(base: Base): Promise<void> {
  await Promise.all([createBaseObjects(base), createBaseUnits(base)])
}

export async function spawnBaseUnitsAndObjects(base: Base): Promise<void> {
  await Promise.all([spawnBaseObjects(base), spawnBaseUnits(base)])
}

async function spawnBaseObjects(base: Base): Promise<void> {
  await base.staticObjects.loadItems()

  await Promise.all(
    Array.from(base.staticObjects).map(async staticObject => {
      await wrap(staticObject).init()

      await spawnStaticObject(staticObject)
    })
  )
}

async function spawnBaseUnits(base: Base) {
  await base.staticObjects.loadItems()

  await Promise.all(
    Array.from(base.units).map(async baseUnit => {
      await wrap(baseUnit).init()

      await spawnGroundUnit(baseUnit)
    })
  )
}

export async function createAndSpawnBaseUnitsAndObjects(
  base: Base
): Promise<void> {
  await createBaseUnitsAndObjects(base)
  await spawnBaseUnitsAndObjects(base)
}

export async function destroyAndDespawnBaseUnitsAndObject(
  base: Base
): Promise<void> {
  await despawnFarp()

  await Promise.all([destroyBaseObjects(base), destroyBaseUnits(base)])
}

async function destroyBaseObjects(base: Base): Promise<void> {
  const em = entityManager(await orm)

  const staticObjects = await base.staticObjects.loadItems()

  for (const staticObject of staticObjects) {
    // delete the static object
    await em.removeAndFlush(staticObject)
    // despawn the static object
    await despawnStaticObject(staticObject)
  }
}

async function destroyBaseUnits(base: Base): Promise<void> {
  const em = entityManager(await orm)

  const baseUnits = await base.units.loadItems()
  for (const unit of baseUnits) {
    // delete the unit
    await em.removeAndFlush(unit)
    // despawn the unit
    await despawnGroundUnit(unit)
  }
}

export async function findNearbyBases({
  position,
  accuracy,
  coalition,
}: {
  position: Pick<Position, 'lat' | 'lon'>
  accuracy: number
  coalition: Coalition
}): Promise<Base[]> {
  const em = entityManager(await orm)

  const baseRepository = em.getRepository(Base)

  const { lat, lon } = position

  let query = baseRepository
    .createQueryBuilder('b')
    .select('*')
    .leftJoinAndSelect('b.position', 'p')
    .where({
      $and: [
        { position: { lat: { $gte: lat - metersToDegree(accuracy) } } },
        { position: { lat: { $lte: lat + metersToDegree(accuracy) } } },
        { position: { lon: { $gte: lon - metersToDegree(accuracy) } } },
        { position: { lon: { $lte: lon + metersToDegree(accuracy) } } },
      ],
    })

  // if not all, search by coalition
  if (Coalition.COALITION_ALL !== coalition) {
    query = query.andWhere({ coalition })
  }

  const nearby = await query.getResultList()

  // initialize the returned
  return nearby
    .map(base => {
      return { base, distance: distanceFrom(position, base.position) }
    })
    .filter(base => base.distance <= accuracy)
    .sort((a, b) => a.distance - b.distance)
    .map(base => base.base)
}

export async function upgradeBaseTypeTo(
  base: Base,
  nextBaseType: BaseType
): Promise<void> {
  //
}
