import { Position } from '../../generated/dcs/common/v0/Position'
import {
  BirthEvent,
  Events,
  EventType,
  GroupCommandEvent,
  MarkAddEvent,
  MarkChangeEvent,
  PlayerSendChatEvent,
} from '../events'
import { outGroupText, outUnitText, removeMapMark } from '../trigger'

import { getMarkById, getMarkPanels, MarkPanel } from '../custom'
import { MarkPanelsMissingError } from '../errors'
import { groupFromGroupName } from '../group'
import { countryFrom } from '../country'
import { searchUnits } from './searchUnits'
import {
  createUnit,
  destroyUnit,
  spawnGroundUnit,
  spawnGroundUnitsInCircle,
  spawnGroundUnitsOnCircle,
} from '../unit'
import {
  CommandType,
  CommandType as EventCommandType,
  ToDestroy,
} from '../commands/types'
import { nearbyUnits, unitGone } from '../db'
import { distanceFrom, positionLLFrom } from '../common'
import {
  findSpawnGroupBy,
  insertOrUpdateSpawnGroup,
  typeNamesFrom,
} from '../db/spawnGroups'

const DESTROY_SINGLE_UNIT_SEARCH_RANGE = 250

type GroupID = number

const groupSpawnSelection = new Map<
  GroupID,
  {
    typeName: string // unit typeName to spawn
    createdAt: Date // date selection was create at (for gc)
  }
>()
const groupSpawnLocation = new Map<
  GroupID,
  {
    markerId: number
    position: Position
    createdAt: Date // date location was created at
  }
>()

export async function spawnUnitsMain(): Promise<() => Promise<void>> {
  const subscription = Events.subscribe(async event => {
    if (EventType.GroupCommand === event.type) {
      return handleGroupCommand(event as GroupCommandEvent)
    }
    if (EventType.Birth === event.type) {
      return handleBirth(event as BirthEvent)
    }
    if (EventType.MarkAdd === event.type) {
      return handleMarkAddEvent(event as MarkAddEvent)
    }
    if (EventType.MarkChange === event.type) {
      return handleMarkChangeEvent(event as MarkChangeEvent)
    }
    if (EventType.PlayerSendChat === event.type) {
      return handlePlayerSendChatEvent(event as PlayerSendChatEvent)
    }
  })

  return async () => {
    subscription.unsubscribe()
  }
}

async function handlePlayerSendChatEvent(event: PlayerSendChatEvent) {
  const { playerId, command } = event

  if (command) {
    if (EventCommandType.DefineSpawnGroup === command.type) {
      const { groupName, units } = command
      const typeNames = units
        .map(({ fuzzyUnitName }) => searchUnits(fuzzyUnitName).desc?.typeName)
        .filter((a): a is string => typeof a === 'string')

      await insertOrUpdateSpawnGroup(groupName, typeNames)

      await outUnitText(
        playerId,
        `Spawn group ${groupName} updated with units: ${typeNames.join(',')}`
      )
    }
  }
}

async function handleMarkChangeEvent(event: MarkChangeEvent) {
  const { id, initiator, command } = event

  // attempt to handle command(s) from markers
  if (command) {
    if (EventCommandType.SpawnGroundUnit === command.type) {
      const addedMark = await getMarkById(id)

      if (!addedMark) {
        throw new Error('expected addedMark')
      }

      const { coalition = addedMark.coalition } = command

      // TODO: use the map marker to post errors back to the user

      const unitsToSpawn = command.units
        .map(({ fuzzyUnitName, count }) => {
          const unitToSpawn = searchUnits(fuzzyUnitName)

          if (!unitToSpawn.desc) {
            return undefined
          }

          const unit = {
            typeName: unitToSpawn.desc.typeName,
          }

          if (count) {
            return Array.from({ length: count }).map(() => unit)
          }

          return unit
        })
        .flat(2)
        .filter((a): a is { typeName: string } => Boolean(a))

      if (unitsToSpawn.length > 0) {
        const country = countryFrom(coalition)
        if (unitsToSpawn.length > 1) {
          // multiple units
          await spawnGroundUnitsInCircle(
            country,
            addedMark.position,
            100, // TODO: handle radius here
            unitsToSpawn
          )
        } else {
          const unit = await createUnit({
            country,
            // TODO: choose a heading to spawn the unit at
            heading: 0,
            isPlayerSlot: false,
            position: addedMark.position,
            typeName: unitsToSpawn[0].typeName,
          })
          // single unit
          await spawnGroundUnit(unit)
        }
        // remove the map marker
        await removeMapMark(id)
      }

      return
    }
    if (EventCommandType.Destroy === command.type) {
      if (
        command.toDestroy != undefined &&
        command.toDestroy !== ToDestroy.Unit
      ) {
        // don't destroy non-units when toDestroy is not correct
        return
      }
      const addedMark = await getMarkById(id)

      if (!addedMark) {
        throw new Error('expected addedMark')
      }

      // TODO: use the map marker to post errors back to the user

      const markPosition = addedMark.position
      const { coalition = addedMark.coalition } = command

      const foundUnits = await nearbyUnits({
        position: markPosition,
        accuracy: command.radius || DESTROY_SINGLE_UNIT_SEARCH_RANGE,
        coalition: coalition,
      })

      if (foundUnits.length < 1) {
        throw new Error('no nearby units found to destroy')
      }

      // if no radius is given, only take the closest unit
      if (typeof command.radius !== 'number') {
        foundUnits.length = 1
      }

      await Promise.all(
        foundUnits.map(async unit => {
          const { name, position } = unit
          if (
            distanceFrom(markPosition, position) <=
            (command.radius || DESTROY_SINGLE_UNIT_SEARCH_RANGE)
          ) {
            await destroyUnit(unit)
            await unitGone({ name })
          }
        })
      )

      await removeMapMark(addedMark.id)
    }
    if (EventCommandType.SpawnGroup === command.type) {
      const addedMark = await getMarkById(id)

      if (!addedMark) {
        throw new Error('expected addedMark')
      }

      const { groupName } = command

      const spawnGroup = await findSpawnGroupBy(groupName)

      if (!spawnGroup) {
        throw new Error('could not find spawn group with given name')
      }

      let radius = 50 // default to 50 meters

      if (command.radius) {
        radius = command.radius
      }

      const unitsToSpawn = typeNamesFrom(spawnGroup.typeNamesJson).map(
        typeName => {
          return { typeName }
        }
      )

      await spawnGroundUnitsOnCircle(
        countryFrom(addedMark.coalition),
        addedMark.position,
        radius,
        unitsToSpawn
      )

      // remove the map marker
      await removeMapMark(id)
      return
    }
  }

  // TODO: put below in fn(s)
  // if a mark is changed after being added it should no longer be considered a valid spawn location
  // we have to maintain it
  const { unit } = initiator

  if (typeof unit === 'undefined') {
    // user is probably in a jtac/game master/tac commander slot
    // because we can't get a groupId from the mark initiator, we don't continue here
    return
  }

  const { groupName } = unit

  if (!groupName) {
    throw new Error('expected groupName on marker initiator')
  }

  const group = await groupFromGroupName(groupName)

  if (!group.id) {
    throw new Error('expected id on group')
  }

  // if the player already has a pending spawn location
  if (groupSpawnLocation.has(group.id)) {
    // remove the location
    groupSpawnLocation.delete(group.id)
  }
}

async function handleMarkAddEvent(event: MarkAddEvent) {
  const { id, initiator } = event

  if (!id) {
    throw new Error('expected id on payload')
  }

  // payload is missing initiator when client is in jtac/tac command/game master slots
  // we only get initiator when the client is in an airplane or helo slot
  // because of this, for now, we only handle events with an initiator
  if (!initiator) {
    // no-op
    return
  }

  let markPanels: MarkPanel[]
  try {
    markPanels = await getMarkPanels()
  } catch (error) {
    if (error instanceof MarkPanelsMissingError) {
      // no-op
      return
    }
    throw error
  }

  const addedMark = markPanels.find(mark => mark.id === id)

  if (!addedMark) {
    throw new Error('mark missing from markPanels')
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const position = addedMark.position!
  // TODO: put below in fn(s)
  // if a mark is changed after being added it should no longer be considered a valid spawn location
  // we have to maintain it
  const { unit } = initiator

  if (typeof unit === 'undefined') {
    // user is probably in a jtac/game master/tac commander slot
    // because we can't get a groupId from the mark initiator, we don't continue here
    return
  }

  const { country, groupName } = unit

  if (!country) {
    throw new Error('expected country on marker initiator')
  }
  if (!groupName) {
    throw new Error('expected groupName on marker initiator')
  }

  const group = await groupFromGroupName(groupName)

  if (!group.id) {
    throw new Error('expected id on group')
  }

  // if the player already has a pending spawn selection
  if (groupSpawnSelection.has(group.id)) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const typeName = groupSpawnSelection.get(group.id)!.typeName

    const unit = await createUnit({
      country,
      // TODO: choose a heading to spawn the unit at
      heading: 0,
      isPlayerSlot: false,
      position,
      typeName,
    })

    // use it to spawn a unit on the new marker
    await spawnGroundUnit(unit)

    // remove the selection
    groupSpawnSelection.delete(group.id)

    // remove the map marker
    await removeMapMark(id)

    return
  }

  // otherwise update the player marker
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  groupSpawnLocation.set(group.id!, {
    markerId: id,
    position,
    createdAt: new Date(),
  })
}

async function handleBirth(event: BirthEvent) {
  if (!event.initiator.unit) {
    // no-op
    return
  }
  const { groupName } = event.initiator.unit

  if (!groupName) {
    throw new Error('expected player entering unit to have groupName')
  }
}

async function handleGroupCommand(event: GroupCommandEvent) {
  const { group, command } = event

  if (CommandType.SpawnGroundUnit === command.type) {
    const typeName = command.units[0].fuzzyUnitName

    if (!typeName || typeof typeName !== 'string') {
      throw new Error('expected typeName of type string on details')
    }

    if (groupSpawnLocation.has(group.id)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const { markerId, position } = groupSpawnLocation.get(group.id)!

      const unit = await createUnit({
        country: countryFrom(group.coalition),
        // TODO: choose a heading to spawn the unit at
        heading: 0,
        isPlayerSlot: false,
        position: positionLLFrom(position),
        typeName,
      })
      // we have a location, spawn something here
      await spawnGroundUnit(unit)

      // remove the map marker
      await removeMapMark(markerId)

      // remove the selection
      groupSpawnLocation.delete(group.id)
      return
    }

    // // otherise store this typeName for this player for when a map marker is added
    groupSpawnSelection.set(group.id, {
      typeName,
      createdAt: new Date(),
    })

    // // send a message
    await outGroupText(
      group.id,
      `Place a marker on the F10 map to spawn the ${typeName}`
    )
  }
}
