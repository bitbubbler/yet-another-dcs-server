import {
  CommandType,
  CommandType as EventCommandType,
  ToDestroy,
} from '../commands/types'
import { countryFrom, distanceFrom } from '../convert'
import { getMarkById } from '../custom'
import { SpawnGroup, UnitTypeName } from '../db'
import { emFork } from '../db/connection'
import {
  Events,
  EventType,
  GroupCommandEvent,
  MarkChangeEvent,
  PlayerSendChatEvent,
} from '../events'
import { outGroupText, outUnitText, removeMapMark } from '../trigger'
import {
  createGroundUnitsInCircle,
  despawnGroundUnit,
  findNearbyUnits,
  spawnGroundUnit,
} from '../unit'
import { searchUnits } from './searchUnits'

const DESTROY_SINGLE_UNIT_SEARCH_RANGE = 250

export async function spawnUnitsMain(): Promise<() => Promise<void>> {
  const subscription = Events.subscribe(async event => {
    if (EventType.GroupCommand === event.type) {
      return handleGroupCommand(event)
    }
    if (EventType.MarkChange === event.type) {
      return handleMarkChangeEvent(event)
    }
    if (EventType.PlayerSendChat === event.type) {
      return handlePlayerSendChatEvent(event)
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

      const spawnGroup = new SpawnGroup({
        name: groupName,
        typeNames,
      })

      const em = await emFork()
      await em.upsert(spawnGroup)

      await outUnitText(
        playerId,
        `Spawn group ${groupName} updated with units: ${typeNames.join(',')}`
      )
    }
  }
}

async function handleMarkChangeEvent(event: MarkChangeEvent) {
  const em = await emFork()
  const spawnGroupRepository = em.getRepository(SpawnGroup)
  const { id, command } = event

  // attempt to handle command(s) from markers
  if (command) {
    if (EventCommandType.SpawnGroundUnit === command.type) {
      const addedMark = await getMarkById(id)

      if (!addedMark) {
        throw new Error('expected addedMark')
      }

      const { coalition = addedMark.coalition } = command
      const { position } = addedMark

      // TODO: use the map marker to post errors back to the user

      const unitsToSpawn = command.units
        .map(({ fuzzyUnitName, count, heading }) => {
          const unitToSpawn = searchUnits(fuzzyUnitName)

          if (!unitToSpawn.desc) {
            return undefined
          }

          const unit = {
            typeName: unitToSpawn.desc.typeName as UnitTypeName,
            heading,
          }

          if (count) {
            return Array.from({ length: count }).map(() => unit)
          }

          return unit
        })
        .flat(2)
        .filter(<T>(a: T): a is Exclude<T, undefined> => Boolean(a))

      const country = countryFrom(coalition)

      // create the units in a circle
      const units = await createGroundUnitsInCircle({
        country,
        focus: position,
        hidden: false,
        radius: 100, // TODO: handle radius here
        units: unitsToSpawn,
      })

      // spawn the units
      await Promise.all(units.map(unit => spawnGroundUnit(unit)))

      // remove the map marker
      await removeMapMark(id)

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

      const foundUnits = await findNearbyUnits({
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
          if (
            distanceFrom(markPosition, unit.position) <=
            (command.radius || DESTROY_SINGLE_UNIT_SEARCH_RANGE)
          ) {
            // despawn the unit.
            await despawnGroundUnit(unit)

            // mark it as gone
            unit.gone()

            // flush the changes
            await em.persistAndFlush(unit)
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

      const spawnGroup = await spawnGroupRepository.findOne({ name: groupName })

      if (!spawnGroup) {
        throw new Error('could not find spawn group with given name')
      }

      let radius = 50 // default to 50 meters

      if (command.radius) {
        radius = command.radius
      }

      const unitsToSpawn = spawnGroup.typeNames.map(typeName => {
        return {
          // TODO: support heading when spawning groups
          heading: 0,
          typeName: typeName as UnitTypeName,
        }
      })

      // create the ground units
      const units = await createGroundUnitsInCircle({
        country: countryFrom(addedMark.coalition),
        focus: addedMark.position,
        radius,
        hidden: false,
        units: unitsToSpawn,
      })

      // spawn the ground units
      await Promise.all(units.map(unit => spawnGroundUnit(unit)))

      // remove the map marker
      await removeMapMark(id)
    }
  }
}

async function handleGroupCommand(event: GroupCommandEvent) {
  const { group, command } = event

  if (CommandType.SpawnGroundUnit === command.type) {
    const typeName = command.units[0].fuzzyUnitName

    if (!typeName || typeof typeName !== 'string') {
      throw new Error('expected typeName of type string on details')
    }

    // // send a message
    await outGroupText(
      group.id,
      `Place a marker on the F10 map to spawn the ${typeName}`
    )
  }
}
