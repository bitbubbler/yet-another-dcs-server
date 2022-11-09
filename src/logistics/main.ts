import {
  BaseType,
  baseTypeDisplayName,
  createBase,
  nextBaseTypeFrom,
  createBaseStaticObjects,
} from '../base'
import { CargoType, createCargo, loadCargo, unloadCargo } from '../cargo'
import { coalitionFrom } from '../coalition'
import { CommandType } from '../commands'
import { deg, randomBetween } from '../common'
import { findUnit, nearbyBases, updateBaseType } from '../db'
import {
  allBaseStaticObjects,
  destroyBaseStaticObject,
} from '../db/baseStaticObjects'
import { allStaticObjects, destroyStaticObject } from '../db/staticObjects'
import { findUnitCargo } from '../db/unitCargos'
import { Events, EventType, GroupCommandEvent } from '../events'
import { LatLon } from '../geo'
import { getUnits } from '../group'
import { despawnStaticObject, spawnStaticObject } from '../staticObject'
import { outCoalitionText, outGroupText } from '../trigger'
import { createUnit, spawnGroundUnit } from '../unit'
import { allUnitsCargoDefinitions, cargoDefinitionFrom } from './definitions'

const oneSecondMs = 1000
/** The minimum range between two bases */
const MIN_BASE_RANGE_METERS = 1000
/** How close a unit has to be to a base to upgrade it */
const BASE_UPGRADE_RANGE_METERS = 100
/** How far away from the unit we should unpack cargo */
const CARGO_UNPACK_DISTANCE_FROM_UNIT_METERS = 50
/** The lower bound of the random time it takes to unpack cargo */
const CARGO_UNPACK_DELAY_MS_MIN = oneSecondMs * 2
/** The upper bound of the random time it takes to unpack cargo */
const CARGO_UNPACK_DELAY_MS_MAX = oneSecondMs * 4

export async function logisticsMain(): Promise<() => Promise<void>> {
  // spawn existing bases and static objects
  for (const staticObject of await allStaticObjects()) {
    spawnStaticObject(staticObject)
  }

  const subscription = Events.subscribe(async event => {
    if (EventType.GroupCommand === event.type) {
      return handleGroupCommand(event as GroupCommandEvent)
    }
  })

  return async () => {
    subscription.unsubscribe()
  }
}

async function handleGroupCommand(event: GroupCommandEvent): Promise<void> {
  const { command, group } = event

  const { type } = command

  if (CommandType.SpawnBase === type) {
    const units = await getUnits(group.name)
    const unit = units[0] // do everything around cargo spawning using the first unit
    const { position } = unit

    const { baseType, heading } = command

    const base = await createBase({
      heading,
      coalition: group.coalition,
      type: baseType,
      position,
    })

    const baseStaticObjects = await createBaseStaticObjects(base)

    for (const staticObject of baseStaticObjects) {
      await spawnStaticObject(staticObject)
    }
  }
  if (CommandType.LoadInternalCargo === type) {
    const units = await getUnits(group.name)
    const unit = await findUnit(units[0].name) // assume cargo is carried by first unit in group.

    if (!unit) {
      throw new Error('missing unit')
    }

    const existingUnitCargo = await findUnitCargo(unit)

    if (typeof existingUnitCargo !== 'undefined') {
      await outGroupText(
        group.id,
        `You already have an internal cargo on board. Limit one!`
      )
      // go no further
      return
    }

    const { position } = unit

    const { cargoDefinitionId } = command

    const cargoDefinition = cargoDefinitionFrom(cargoDefinitionId)
    const { displayName } = cargoDefinition

    const cargo = await createCargo({
      ...cargoDefinition,
      position,
    })

    await loadCargo(unit, cargo)

    await outGroupText(group.id, `Loaded ${displayName}`)
  }
  if (CommandType.UnpackInternalCargo === type) {
    const units = await getUnits(group.name)
    const unit = await findUnit(units[0].name) // assume cargo is carried by first unit in group.

    if (!unit) {
      throw new Error('missing unit')
    }

    const { country, heading } = unit
    const cargo = await findUnitCargo(unit)

    if (!cargo) {
      await outGroupText(group.id, `You have no internal cargo to unpack`)
      return
    }

    await outGroupText(
      group.id,
      `Unpacking cargo at your 12 o'clock.. Hold still.`
    )

    // TODO: timeout if player has moved and show a message. Player should have to try again
    setTimeout(async () => {
      try {
        // determine a point in front of the unit to unpack cargo at
        const basePosition = new LatLon(
          unit.position.lat,
          unit.position.lon
        ).destinationPoint(CARGO_UNPACK_DISTANCE_FROM_UNIT_METERS, deg(heading))

        if (CargoType.BaseCreate === cargo.type) {
          // determine if a new base can be created by checking how close other bases are
          const basesNearby = await nearbyBases({
            position: unit.position,
            accuracy: MIN_BASE_RANGE_METERS,
          })

          // if other bases are too close
          if (basesNearby.length > 0) {
            await outGroupText(
              group.id,
              `You are too close to an existing base to start a new one.`
            )
            // go no further
            return
          }

          // assume that if we get here we are creating a base

          // remove the cargo from the unit
          await unloadCargo(unit, cargo)

          // create the new base
          const base = await createBase({
            coalition: coalitionFrom(country),
            heading,
            position: basePosition,
            type: BaseType.UnderConstruction,
          })

          // create the new static objects for the base
          const baseStaticObjects = await createBaseStaticObjects(base)

          // spawn the bases static objects in the game
          for (const staticObject of baseStaticObjects) {
            await spawnStaticObject(staticObject)
          }

          // TODO: get the gridsquare and print it here
          await outCoalitionText(
            coalitionFrom(country),
            `${unit.name} has started constructing a new base in <gridsquare>`
          )
          // we're done unpacking base create kit
          return
        }
        if (CargoType.BaseUpgrade === cargo.type) {
          // determine if an existing base is nearby to try and upgrade
          const basesNearby = await nearbyBases({
            position: unit.position,
            accuracy: BASE_UPGRADE_RANGE_METERS,
          })

          // if other bases are too close
          if (basesNearby.length < 1) {
            await outGroupText(group.id, `No base found nearby to upgrade.`)
            // go no further
            return
          }

          // use nearest base as the base to upgrade (we only ever expect one base here)
          const base = basesNearby[0]
          const { baseId, type: previousBaseType } = base

          const nextBaseType = nextBaseTypeFrom(base.type)

          // if there are no further upgrades for this base
          if (typeof nextBaseType === 'undefined') {
            await outGroupText(group.id, `This base can't be upgraded anymore.`)
            // go no further
            return
          }

          // assume that if we get here we are upgrading a base

          // unload the cargo from the unit
          await unloadCargo(unit, cargo)

          // get all the old static objects for this
          const oldBaseStaticObjects = await allBaseStaticObjects(baseId)

          // for each of the old static objects, destroy and despawn it
          for (const staticObject of oldBaseStaticObjects) {
            const { staticObjectId } = staticObject
            // destroy the relationship of the static object to the base (in the db)
            await destroyBaseStaticObject(baseId, staticObjectId)
            // destroy the static object (in the db)
            await destroyStaticObject(staticObjectId)
            // despawn the static object (in the game)
            await despawnStaticObject(staticObject)
          }

          // change the base type
          await updateBaseType({
            baseId: base.baseId,
            type: nextBaseType,
          })

          // create the new static objects for the base
          // IMPORTANT: ensure we use the new base type here
          const newBaseStaticObjects = await createBaseStaticObjects({
            ...base,
            type: nextBaseType,
          })

          // spawn the bases static objects in the game
          for (const staticObject of newBaseStaticObjects) {
            await spawnStaticObject(staticObject)
          }

          // TODO: get the gridsquare and print it here
          await outCoalitionText(
            coalitionFrom(country),
            `${
              unit.name
            } has upgraded a base in <gridsquare> from ${baseTypeDisplayName(
              previousBaseType
            )} to ${baseTypeDisplayName(nextBaseType)}`
          )
          // we're done unpacking base upgrade kit
          return
        }
        if (CargoType.UnitCreate === cargo.type) {
          const { unitTypeName } = cargo

          // determine a point in front of the unit to unpack cargo at
          const { lat, lon } = new LatLon(
            unit.position.lat,
            unit.position.lon
          ).destinationPoint(
            CARGO_UNPACK_DISTANCE_FROM_UNIT_METERS,
            deg(heading)
          )

          const position = { lat, lon, alt: 0 }

          // unload the cargo from the unit
          await unloadCargo(unit, cargo)

          // create the new unit
          const newUnit = await createUnit({
            country,
            heading,
            isPlayerSlot: false,
            position,
            typeName: unitTypeName,
          })

          // spawn the unit in the game
          await spawnGroundUnit(newUnit)

          // TODO: get the gridsquare and print it here
          await outCoalitionText(
            coalitionFrom(country),
            `${unit.name} has unpacked a ${cargo.displayName} in <gridsquare>`
          )
          // we're done unpacking base upgrade kit
          return
        }
      } catch (error) {
        console.log('unpack cargo failed', error)
        await outGroupText(
          group.id,
          `Failed to unpack ${cargo.displayName}. Something went wrong`
        )
      }
    }, randomBetween(CARGO_UNPACK_DELAY_MS_MIN, CARGO_UNPACK_DELAY_MS_MAX))
  }
}
