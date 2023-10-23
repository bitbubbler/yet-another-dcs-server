import { equal } from 'assert'

import {
  Events,
  EventType,
  MarkChangeEvent,
  MissionCommandEvent,
} from '../events'
import { markToAll, outText, removeMapMark } from '../trigger'
import { getMarkById, getMarkPanels, MarkPanel } from '../custom'
import { CommandType, ToDestroy } from '../commands'
import { emFork } from '../db/connection'
import { Position, Spawner, SpawnerQueuedUnit, SpawnerType, Unit } from '../db'
import { distanceFrom, PositionLL, randomBetween } from '../common'
import { createGroundUnitsInCircle, spawnGroundUnit } from '../unit'
import { UnitEvents, UnitEventType, UnitGoneEvent } from '../unitEvents'
import { closestPointOnRoads, findPathOnRoads, RoadType } from '../land'
import { driveGroundGroup } from '../group'
import {
  allSpawners,
  createSpawner,
  findNearbySpawners,
  spawnerDestroyed,
} from '../spawner'
import { coalitionFrom } from '../coalition'
import { wrap } from '@mikro-orm/core'
import { LatLon } from '../geo'

const UNIT_MAXIMUM_DISPLACEMENT_TO_SPAWNER_METERS = 100000
const SPAWNER_MINIMUM_DISPLACEMENT_METERS = 250
const DESTROY_SINGLE_UNIT_SEARCH_RANGE = 250
const SPAWNER_MAXIMUM_UNITS_PER_CYCLE = 2 // (per spawner)
const SPAWNER_UNIT_RANDOM_FOCUS_RADIUS = 150
const SPAWNER_DETECT_CAPTURE_INTERVAL_SECONDS = 5

let spawnersVisible = true // show/hide spawners on f10

export async function autoRespawnMain(): Promise<() => Promise<void>> {
  const eventsSubscriptions = Events.subscribe(async event => {
    if (EventType.MarkChange === event.type) {
      return handleMarkChangeEvent(event)
    }
    if (EventType.MissionCommand === event.type) {
      return handleMissionCommand(event)
    }
  })
  const unitEventsSubscriptions = UnitEvents.subscribe(async unitEvent => {
    if (UnitEventType.Gone === unitEvent.type) {
      return handleUnitGoneEvent(unitEvent)
    }
  })

  if (spawnersVisible) {
    await showSpawners()
  }

  const teardownRespawnQueue = respawnQueue()
  const teardownDetectCapture = detectCapture()

  // teardown function
  return async () => {
    eventsSubscriptions.unsubscribe()
    unitEventsSubscriptions.unsubscribe()
    teardownDetectCapture()
    teardownRespawnQueue()
  }
}

function detectCapture(): () => void {
  let detectTimeout: NodeJS.Timeout | undefined

  /**
   * Detect captured spawners
   */
  const detectCapturedSpawners = async (): Promise<void> => {
    // get the location of all uncaptured spawners
    // do a search for nearby units to each uncaptured spawner
    // any uncaptured spawners with enough units nearby to capture it, mark captured
  }

  /**
   * Clear and set a new detect timeout with a random queue time
   */
  const resetDetectTimeout = (): void => {
    if (detectTimeout) {
      clearTimeout(detectTimeout)
    }
    detectTimeout = setTimeout(
      detectCapturedSpawners,
      1000 * SPAWNER_DETECT_CAPTURE_INTERVAL_SECONDS
    )
  }

  // kick off the respawn queue with an initial reset
  resetDetectTimeout()

  // teardown function
  return () => {
    if (detectTimeout) {
      clearTimeout(detectTimeout)
    }
  }
}

function respawnQueue(): () => void {
  let queueTimeout: NodeJS.Timeout | undefined

  /**
   * Respawn units (used when the queue timeout pops)
   */
  const respawnUnits = async (): Promise<void> => {
    const em = await emFork()
    const spawnerRepository = em.getRepository(Spawner)

    const spawners = await spawnerRepository.findAll()

    for (const spawner of spawners) {
      const queuedUnits = await spawner.queuedUnits.matching({
        populate: ['unit'],
        limit: SPAWNER_MAXIMUM_UNITS_PER_CYCLE,
      })

      const randomQueuedUnit =
        queuedUnits[randomBetween(1, queuedUnits.length) - 1].getProperty(
          'unit'
        )

      // use the position of one of the units randomly

      const { country, position: randomUnitDeathPosition } = randomQueuedUnit

      const [firstOnRoadPosition, lastOnRoadPosition]: [
        PositionLL,
        PositionLL,
      ] = await Promise.all([
        closestPointOnRoads(RoadType.Roads, spawner.position),
        closestPointOnRoads(RoadType.Roads, randomUnitDeathPosition),
      ])

      // MUST remove them from the db first, to avoid issues with concurrently spawning being marked gone
      // mark the spawnerQueue items for these units as done
      for (const queuedUnit of queuedUnits) {
        queuedUnit.unwrap().done()
      }

      // make sure the changes are flushed
      await em.flush()

      const path = await findPathOnRoads(
        RoadType.Roads,
        firstOnRoadPosition,
        lastOnRoadPosition
      )

      // TODO: fix this, it fails to create units

      // spawn the units in a circle on the position
      const units = await createGroundUnitsInCircle({
        country,
        focus: spawner.position,
        hidden: false,
        radius: SPAWNER_UNIT_RANDOM_FOCUS_RADIUS,
        units: queuedUnits.map(queued => {
          const unit = queued.getProperty('unit')
          const { typeName, position } = unit
          const { heading } = position

          return {
            heading,
            typeName,
          }
        }),
      })

      const groups = await Promise.all(units.map(unit => spawnGroundUnit(unit)))

      // we have to wait a short delay after spawning a unit before giving it tasks
      await new Promise(resolve => setTimeout(resolve, 100))

      // drive the spawned group(s) to the death position
      await Promise.all(
        groups.map(async ({ groupName }) => {
          // Find a  pseudo random destination position for this unit to drive to
          const { lat, lon } = new LatLon(
            randomUnitDeathPosition.lat,
            randomUnitDeathPosition.lon
          ).destinationPoint(
            randomBetween(50, 2000), // random distance
            randomBetween(0, 360) // random heading
          )

          const position = { lat, lon, alt: 0 }

          await driveGroundGroup({
            groupName,
            position: spawner.position,
            // TODO: improve points logic here to make pathing of spawned units less.. dumb
            // use path if it has points, otherwise use the first and last onroad points
            points:
              path.length > 0
                ? path
                : [firstOnRoadPosition, lastOnRoadPosition],
            destination: position,
            onroad: false,
          })
        })
      )
    }

    // TODO: if the above errors, null out the doneAt value again to give it an attempt to respawn
  }

  /**
   * Clear and set a new queue timeout with a random queue time
   */
  const resetQueueTimeout = (): void => {
    if (queueTimeout) {
      clearTimeout(queueTimeout)
    }
    queueTimeout = setTimeout(async () => {
      await respawnUnits().catch(error => {
        console.log('error while respawning units', error)
      })
      resetQueueTimeout()
    }, randomQueueTime())
  }

  // kick off the respawn queue with an initial reset
  resetQueueTimeout()

  // teardown function
  return () => {
    if (queueTimeout) {
      clearTimeout(queueTimeout)
    }
  }
}

function randomQueueTime(): number {
  const oneMinute = 1000 * 60
  const twoMinutes = oneMinute * 2

  return randomBetween(oneMinute, twoMinutes)
}

async function handleUnitGoneEvent(event: UnitGoneEvent) {
  const em = await emFork()
  const unitRepository = em.getRepository(Unit)

  const unit = await unitRepository.findOne({
    name: event.unit.name,
    canRespawn: true,
    isPlayerSlot: false,
  })

  if (!unit) {
    /**
     * We want to quietly ignore a few cases here:
     * - player slots
     * - units not in the database for whatever reason (that YADS did spawn)
     * - units that can exist in mission file (that YADS doesn't manage)
     * - units that shouldn't respawn (marked as `canRespawn=false` in the db)
     */
    // quietly ignore units not in the database, or units that can't respawn
    return
  }

  const { country, unitId, position, typeName } = unit

  // look for nearby spawners of matching coalition
  const foundNearbyCoalitionSpawners = await findNearbySpawners({
    position,
    accuracy: UNIT_MAXIMUM_DISPLACEMENT_TO_SPAWNER_METERS,
    coalition: coalitionFrom(country),
  })

  const firstSpawner = foundNearbyCoalitionSpawners[0]

  if (!firstSpawner) {
    throw new Error('no spawner found in range')
  }

  const { spawnerId } = firstSpawner

  // mark the unit destroyed
  unit.destroyed()

  // add unit to respawn queue of closest spawner
  firstSpawner.queuedUnits.add(
    wrap(new SpawnerQueuedUnit({ spawner: firstSpawner, unit })).toReference()
  )

  // flush db changes
  await em.flush()

  console.log(
    `unit ${unitId} of type ${typeName} queued to spawner ${spawnerId}`
  )
}

async function handleMarkChangeEvent(event: MarkChangeEvent) {
  const { id, command } = event

  // attempt to handle command(s) from markers
  if (command) {
    if (CommandType.CreateSpawner === command.type) {
      const {
        coalition = command.coalition || event.coalition, // coalition should prioritize command input
        spawnerType = SpawnerType.Easy,
      } = command
      const addedMark = await getMarkById(id)

      if (!addedMark) {
        throw new Error('expected addedMark')
      }

      const { lat, lon } = addedMark.position
      const position = new Position({ lat, lon, alt: 0, heading: 0 })

      const spawnersNearby = await findNearbySpawners({
        position,
        accuracy: SPAWNER_MINIMUM_DISPLACEMENT_METERS,
        coalition,
      })

      // make sure spawner meets minimum displacement requirement
      if (spawnersNearby.length > 0) {
        await removeMapMark(addedMark.id)
        await outText(`Too many nearby spawners`)
        throw new Error('Too many nearby spawners')
      }

      const spawner = await createSpawner({
        coalition,
        position,
        type: spawnerType,
      })

      await removeMapMark(addedMark.id)
      await addMarkerForSpawner(spawner)
      await outText(`Spawner ${spawner.spawnerId} created`)
    }
    if (CommandType.Destroy === command.type) {
      if (
        command.toDestroy != undefined &&
        command.toDestroy !== ToDestroy.Spawner
      ) {
        // if something else specific was specified, don't try to destroy spawners
        return
      }
      const addedMark = await getMarkById(id)

      if (!addedMark) {
        throw new Error('expected addedMark')
      }

      const markPosition = addedMark.position
      const { coalition = addedMark.coalition } = command

      const foundSpawners = await findNearbySpawners({
        position: markPosition,
        accuracy: command.radius || DESTROY_SINGLE_UNIT_SEARCH_RANGE,
        coalition: coalition,
      })

      equal(
        foundSpawners.length > 0,
        true,
        'no nearby spawners found to destroy'
      )

      // if no radius is given, only take the closest spawner
      if (typeof command.radius !== 'number') {
        foundSpawners.length = 1
      }

      await Promise.all(
        foundSpawners.map(async spawner => {
          if (
            distanceFrom(markPosition, spawner.position) <=
            (command.radius || DESTROY_SINGLE_UNIT_SEARCH_RANGE)
          ) {
            const { spawnerId } = spawner

            await spawnerDestroyed(spawner) // destroy

            // remove existing spawner marker
            const existingMarker = await findSpawnerMarker(spawnerId)

            if (existingMarker) {
              await removeMapMark(existingMarker.id)
            }

            await outText(`Spawner ${spawnerId} destroyed`)
          }
        })
      )

      await removeMapMark(addedMark.id)
    }
  }
}

async function handleMissionCommand(event: MissionCommandEvent): Promise<void> {
  const { command } = event

  const { type } = command

  if (CommandType.ShowSpawners === type) {
    spawnersVisible = true
    await showSpawners()
  }
  if (CommandType.HideSpawners === type) {
    spawnersVisible = false
    await hideSpawners()
  }
}

async function showSpawners(): Promise<void> {
  const spawners = await allSpawners()

  const existingSpawnerMarkers = await spawnerMarkers()

  const existingSpawnersMarkerIds = existingSpawnerMarkers.map(
    marker => marker.spawnerId
  )

  // make map markers concurrently for each spawner
  await Promise.all(
    spawners.map(async spawner => {
      if (existingSpawnersMarkerIds.includes(spawner.spawnerId)) {
        // a map marker already exists for this spawner, do nothing
        return
      }

      await addMarkerForSpawner(spawner)
    })
  )
}

interface SpawnerMarker extends MarkPanel {
  spawnerId: number
}

function spawnerIdFromMarkerText(text: string): number | undefined {
  const matches = text.match(/Id: (\d+)/)

  if (matches && matches.length > 1) {
    return Number(matches[1])
  }

  return undefined
}

async function hideSpawners(): Promise<void> {
  const existingSpawnerMarkers = await spawnerMarkers()

  await Promise.all(
    existingSpawnerMarkers.map(async marker => {
      await removeMapMark(marker.id)
    })
  )
}

async function findSpawnerMarker(
  spawnerId: number
): Promise<SpawnerMarker | undefined> {
  const markers = await spawnerMarkers()

  return markers.find(marker => marker.spawnerId === spawnerId)
}

async function spawnerMarkers(): Promise<SpawnerMarker[]> {
  const existingMarkers = await getMarkPanels()

  const existingSpawnersMarkers = existingMarkers
    .filter(marker => marker.text && textIsSpawnerMarker(marker.text))
    .map<SpawnerMarker | undefined>(marker => {
      if (!marker.text) {
        return undefined
      }

      const spawnerId = spawnerIdFromMarkerText(marker.text)

      if (!spawnerId) {
        return undefined
      }

      return {
        ...marker,
        spawnerId,
      }
    })
    .filter((marker): marker is SpawnerMarker => Boolean(marker))

  return existingSpawnersMarkers
}

async function addMarkerForSpawner(spawner: Spawner): Promise<void> {
  const { position } = spawner

  await markToAll({
    position,
    readonly: true,
    text: spawnerMarkerDescription(spawner),
  })
}

const generatedBanner = `**generated|spawners**`

function textIsSpawnerMarker(text: string): boolean {
  return text.startsWith(generatedBanner)
}

function spawnerMarkerDescription(
  spawner: Pick<Spawner, 'type' | 'coalition' | 'spawnerId'>
): string {
  const { coalition, spawnerId, type } = spawner
  return `
${generatedBanner}
Id: ${spawnerId}
Coalition: ${coalition}
Type: ${type}
`.trim() // use trim here to remove the newlines before and after
}
