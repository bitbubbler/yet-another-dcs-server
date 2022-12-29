import {
  BaseType,
  baseTypeDisplayName,
  createBase,
  nextBaseTypeFrom,
  validateBase,
  destroyAndDespawnBaseUnitsAndObject,
  despawnBase,
  createAndSpawnBaseUnitsAndObjects,
  spawnBase,
  createBaseUnitsAndObjects,
} from '../base'
import { CargoType, createCargo, loadCargo, unloadCargo } from '../cargo'
import { coalitionFrom } from '../coalition'
import { CommandType, ToDestroy } from '../commands'
import { deg, randomBetween } from '../common'
import { getMarkById } from '../custom'
import {
  allBases,
  baseGone,
  findUnit,
  nearbyBases,
  updateBaseType,
} from '../db'
import { findUnitCargo } from '../db/unitCargos'
import {
  BirthEvent,
  Events,
  EventType,
  GroupCommandEvent,
  MarkChangeEvent,
} from '../events'
import { LatLon } from '../geo'
import { getUnits, groupFromGroupName } from '../group'
import { outCoalitionText, outGroupText, removeMapMark } from '../trigger'
import { createUnit, getPositionVelocity, spawnGroundUnit } from '../unit'
import { cargoDefinitionFrom } from './definitions'

const oneSecondMs = 1000
/** how close a unit has to be to a base to pickup cargo */
const UNIT_LOGISTICS_PICKUP_RANGE_METERS = 100
/** How close a unit has to be to a base to upgrade it */
const BASE_UPGRADE_RANGE_METERS = 100
/** How far away from a base a unit has to be to unpack cargo */
const CARGO_UNPACK_MIN_DISTANCE_FROM_BASE_METERS = 200
/** How far away from the unit we should unpack cargo */
const CARGO_UNPACK_DISTANCE_FROM_UNIT_METERS = 50
/** The lower bound of the random time it takes to unpack cargo */
const CARGO_UNPACK_DELAY_MS_MIN = oneSecondMs * 2
/** The upper bound of the random time it takes to unpack cargo */
const CARGO_UNPACK_DELAY_MS_MAX = oneSecondMs * 4
/** How far, by default, to search for bases to destroy when commanded */
const DESTROY_SINGLE_BASE_SEARCH_RANGE_METERS = 100

export async function logisticsMain(): Promise<() => Promise<void>> {
  await Promise.all(
    (
      await allBases()
    ).map(async base => {
      await spawnBase(base)
    })
  )

  const subscription = Events.subscribe(async event => {
    if (EventType.GroupCommand === event.type) {
      return handleGroupCommand(event)
    }
    if (EventType.MarkChange === event.type) {
      return handleMarkChange(event)
    }
    if (EventType.Birth === event.type) {
      return handleBirth(event)
    }
  })

  return async () => {
    subscription.unsubscribe()
  }
}

async function handleBirth(event: BirthEvent): Promise<void> {
  if (!event.initiator.unit) {
    // no-op
    return
  }

  const group = await groupFromGroupName(event.initiator.unit.groupName)

  const units = await getUnits(event.initiator.unit.name)
  const unit = await findUnit(units[0].name) // assume cargo is carried by first unit in group.

  if (!unit) {
    // if there is no unit, we have nothing to do
    return
  }

  const cargo = await findUnitCargo(unit)

  if (!cargo) {
    // if there is no cargo, we have nothing to do
    return
  }

  // unload the units cargo at birth
  await unloadCargo(unit, cargo)

  // let the user know their internal cargo is reset (it's safe to load new cargo)
  await outGroupText(group.id, `Your internal cargo has been reset`)
}

async function handleGroupCommand(event: GroupCommandEvent): Promise<void> {
  const { command, group } = event

  const { type } = command

  if (CommandType.LoadInternalCargo === type) {
    const units = await getUnits(group.name)
    const unit = await findUnit(units[0].name) // assume cargo is carried by first unit in group.

    if (!unit) {
      throw new Error('missing unit')
    }

    const existingNearbyBases = await nearbyBases({
      position: unit.position,
      accuracy: UNIT_LOGISTICS_PICKUP_RANGE_METERS,
      coalition: coalitionFrom(unit.country),
    })

    if (
      existingNearbyBases.find(function (base) {
        return [BaseType.FARP, BaseType.FOB, BaseType.MOB].includes(base.type)
      }) === undefined
    ) {
      await outGroupText(
        group.id,
        "You can't pickup cargo here! You are not close enough to a friendly logistics point."
      )
      // go no further
      return
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

    const originBaseId = existingNearbyBases[0].baseId
    const { position } = unit

    const { cargoDefinitionId } = command

    const cargoDefinition = cargoDefinitionFrom(cargoDefinitionId)
    const { displayName } = cargoDefinition

    const cargo = await createCargo({
      ...cargoDefinition,
      originBaseId,
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
    const coalition = coalitionFrom(country)
    const cargo = await findUnitCargo(unit)
    const [{ p: startingVec3 }] = await getPositionVelocity(unit.name)

    if (!cargo) {
      await outGroupText(group.id, `You have no internal cargo to unpack`)
      return
    }

    await outGroupText(
      group.id,
      `Unpacking ${cargo.displayName} at your 12 o'clock.. Hold still.`
    )

    // TODO: timeout if player has moved and show a message. Player should have to try again
    setTimeout(async () => {
      try {
        // if the player has moved while the random timer counted down, halt
        const [{ p: currentVec3 }] = await getPositionVelocity(unit.name)

        if (
          startingVec3.x === currentVec3.x &&
          startingVec3.y === currentVec3.y &&
          startingVec3.z === currentVec3.z
        ) {
          await outGroupText(group.id, `Unpacking failed: You moved!`)
          // go no further
          return
        }

        if (
          [CargoType.BaseCreate, CargoType.BaseUpgrade].includes(cargo.type) ===
          false
        ) {
          if (
            (
              await nearbyBases({
                position: unit.position,
                accuracy: CARGO_UNPACK_MIN_DISTANCE_FROM_BASE_METERS,
                coalition: coalitionFrom(country),
              })
            ).length > 0
          ) {
            // if you try to unpack too close to an existing base (prevent spawn spam without moving)
            await outGroupText(
              group.id,
              `Unpacking failed: You can't unpack that here! You're too close to a base. You must be at least ${CARGO_UNPACK_MIN_DISTANCE_FROM_BASE_METERS} meters away.`
            )
            // go no further
            return
          }
        }

        // determine a point in front of the unit to unpack cargo at
        const basePosition = new LatLon(
          unit.position.lat,
          unit.position.lon
        ).destinationPoint(CARGO_UNPACK_DISTANCE_FROM_UNIT_METERS, deg(heading))

        if (CargoType.BaseCreate === cargo.type) {
          // make sure a new base here would be valid
          const baseIsValid = await validateBase({
            coalition,
            position: basePosition,
            type: BaseType.UnderConstruction,
          })

          // If this base would be invalid after we upgrade it's type
          if (baseIsValid.valid === false) {
            await outGroupText(
              group.id,
              `Unpacking failed: A new base can't be created here: ${baseIsValid.reason}`
            )
            // go no further
            return
          }

          // assume that if we get here we are creating a base

          // remove the cargo from the unit
          await unloadCargo(unit, cargo)

          // create the new base
          const base = await createBase({
            coalition,
            heading,
            position: basePosition,
            type: BaseType.UnderConstruction,
          })

          await createBaseUnitsAndObjects(base)

          await spawnBase(base)

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
            accuracy: BASE_UPGRADE_RANGE_METERS,
            coalition,
            position: unit.position,
          })

          // if we don't find any base to upgrade
          if (basesNearby.length < 1) {
            await outGroupText(
              group.id,
              `Base upgrade failed: No base found nearby to upgrade.`
            )
            // go no further
            return
          }

          // use nearest base as the base to upgrade (we only ever expect one base here)
          const base = basesNearby[0]

          // ensure the cargo we are unpacking came from another base
          if (base.baseId === cargo.originBaseId) {
            await outGroupText(
              group.id,
              `Base upgrade failed: Nice try, but you got that cargo from here! You must use a base upgrade from a different base.`
            )
            // go no further
            return
          }

          const { type: previousBaseType } = base

          const nextBaseType = nextBaseTypeFrom(base.type)

          // if there are no further upgrades for this base
          if (typeof nextBaseType === 'undefined') {
            await outGroupText(
              group.id,
              `Base upgrade failed: This base can't be upgraded anymore.`
            )
            // go no further
            return
          }

          // make sure the upgraded base (with it's new type) is still valid
          const baseIsValid = await validateBase({
            ...base,
            type: nextBaseType,
          })

          // If this base would be invalid after we upgrade it's type
          if (baseIsValid.valid === false) {
            await outGroupText(
              group.id,
              `This base can't be upgraded: ${baseIsValid.reason}`
            )
            // go no further
            return
          }

          // assume that if we get here we are upgrading a base

          // unload the cargo from the unit
          await unloadCargo(unit, cargo)

          await destroyAndDespawnBaseUnitsAndObject(base)

          // change the base type
          await updateBaseType({
            baseId: base.baseId,
            type: nextBaseType,
          })

          // update the base type on our base object to simplify logic below
          base.type = nextBaseType

          createAndSpawnBaseUnitsAndObjects(base)

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
  if (CommandType.CheckInternalCargo === type) {
    const units = await getUnits(group.name)
    const unit = await findUnit(units[0].name) // assume cargo is carried by first unit in group.

    if (!unit) {
      throw new Error('missing unit')
    }

    const cargo = await findUnitCargo(unit)

    if (!cargo) {
      await outGroupText(group.id, `You have no internal cargo onboard.`)
      return
    }

    await outGroupText(group.id, `You have a ${cargo.displayName} onboard.`)
  }
  if (CommandType.DestroyInternalCargo === type) {
    const units = await getUnits(group.name)
    const unit = await findUnit(units[0].name) // assume cargo is carried by first unit in group.

    if (!unit) {
      throw new Error('missing unit')
    }

    const cargo = await findUnitCargo(unit)

    if (!cargo) {
      await outGroupText(group.id, `You have no internal cargo to destroy`)
      return
    }

    await unloadCargo(unit, cargo)

    await outGroupText(group.id, `Your internal cargo has beeen destroyed`)
  }
}

async function handleMarkChange(event: MarkChangeEvent) {
  const { id, command } = event

  // attempt to handle command(s) from markers
  if (command) {
    if (CommandType.SpawnBase === command.type) {
      const {
        coalition = command.coalition || event.coalition, // coalition should prioritize command input
        baseType = BaseType.UnderConstruction,
      } = command
      const addedMark = await getMarkById(id)

      if (!addedMark) {
        throw new Error('expected addedMark')
      }

      const { position } = addedMark

      // create the new base
      const base = await createBase({
        coalition,
        heading: 0,
        position,
        type: baseType,
      })

      await createBaseUnitsAndObjects(base)

      await spawnBase(base)

      // TODO: get the gridsquare and print it here
      await outCoalitionText(
        coalition,
        `A new base has begun construction in <gridsquare>`
      )

      await removeMapMark(id)
    }
    if (CommandType.Destroy === command.type) {
      if (command.toDestroy !== ToDestroy.Base) {
        // don't destroy base units when toDestroy is not explicitly set
        return
      }

      const addedMark = await getMarkById(id)

      if (!addedMark) {
        throw new Error('expected addedMark')
      }

      const { position } = addedMark

      const foundBases = await nearbyBases({
        position,
        accuracy: command.radius || DESTROY_SINGLE_BASE_SEARCH_RANGE_METERS,
        coalition: command.coalition || event.coalition, // coalition should prioritize command input
      })

      if (foundBases.length < 1) {
        await removeMapMark(addedMark.id)
        return // no bases to remove
      }

      if (typeof command.radius !== 'number') {
        foundBases.length = 1
      }

      await Promise.all(
        foundBases.map(async base => {
          const { baseId } = base

          await despawnBase(base)
          await baseGone(baseId)
        })
      )

      await removeMapMark(addedMark.id)
    }
  }
}
