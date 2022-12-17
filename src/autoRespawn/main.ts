import { equal } from 'assert'

import {
  Events,
  EventType,
  MarkChangeEvent,
  MissionCommandEvent,
} from '../events'
import { markToAll, outText, removeMapMark } from '../trigger'

import { getMarkById, getMarkPanels, MarkPanel } from '../custom'
import {  CommandType, ToDestroy } from '../commands'
import { allSpawners, insertSpawner, spawnerDestroyed } from '../db/spawners'
import { Spawner, SpawnerType } from '../spawner'
import { randomBetween } from '../common'
import {
  findUnit,
  knex,
  Position,
  SpawnerQueue,
  Unit,
  Spawner as DBSpawner,
  unitDestroyed,
} from '../db'
import { PositionLL } from '../common'
import { isPlayerUnit, spawnGroundUnitsInCircle } from '../unit'
import { insertSpawnerQueue, spawnerQueueDone } from '../db/spawnerQueues'
import { UnitEvents, UnitEventType, UnitGoneEvent } from '../unitEvents'
import { closestPointOnRoads, findPathOnRoads, RoadType } from '../land'
import { driveGroundGroup } from '../group'
import { distanceFrom } from '../common'
import { nearbySpawners } from '../spawner'
import { coalitionFrom } from '../coalition'

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
      return handleMarkChangeEvent(event as MarkChangeEvent)
    }
    if (EventType.MissionCommand === event.type) {
      return handleMissionCommand(event as MissionCommandEvent)
    }
  })
  const unitEventsSubscriptions = UnitEvents.subscribe(async unitEvent => {
    if (UnitEventType.Gone === unitEvent.type) {
      return handleUnitGoneEvent(unitEvent as UnitGoneEvent)
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
    // get the spawnerId of waiting queues
    const spawnersQueued = await knex('spawnerQueues')
      .leftJoin('spawners', 'spawnerQueues.spawnerId', 'spawners.spawnerId')
      .leftJoin('positions', 'spawners.positionId', 'positions.positionId')
      .select(['spawners.spawnerId', 'unitId', 'alt', 'lat', 'lon'])
      .count<
        Array<
          Pick<
            Spawner & SpawnerQueue & Position,
            'spawnerId' | 'alt' | 'lat' | 'lon'
          > & { depth: number }
        >
      >('unitId as depth')
      .whereNull('doneAt')
      .whereNull('spawners.capturedAt')
      .whereNull('spawners.goneAt')
      .groupBy('spawners.spawnerId')
      .orderBy('spawnerQueues.createdAt', 'asc')

    // lookup and spawn units for all spawners concurrently
    await Promise.all(
      spawnersQueued.map(async spawner => {
        const { spawnerId, depth } = spawner

        const spawnerPosition: PositionLL = {
          alt: spawner.alt,
          lat: spawner.lat,
          lon: spawner.lon,
        }

        console.log(
          `Attempting to spawn ${SPAWNER_MAXIMUM_UNITS_PER_CYCLE} units for spawner ${spawnerId}. Spawner has a queue depth of ${depth}`
        )

        const unitsToSpawn = await knex('units')
          .leftOuterJoin('positions', function () {
            this.on('units.positionId', '=', 'positions.positionId')
          })
          .leftOuterJoin('spawnerQueues', function () {
            this.on('units.unitId', '=', 'spawnerQueues.unitId')
          })
          .select<
            Pick<
              Unit & Position & SpawnerQueue,
              | 'spawnerId'
              | 'unitId'
              | 'country'
              | 'typeName'
              | 'lat'
              | 'lon'
              | 'alt'
            >[]
          >([
            'spawnerId',
            'units.unitId as unitId',
            'typeName',
            'country',
            'lat',
            'lon',
            'alt',
          ])
          .where({ spawnerId })
          .whereNull('spawnerQueues.doneAt')
          .limit(SPAWNER_MAXIMUM_UNITS_PER_CYCLE)

        const randomUnit =
          unitsToSpawn[randomBetween(1, unitsToSpawn.length) - 1]

        if (!randomUnit) {
          throw new Error('Attempt to randomly pick a unit failed')
        }

        // use the position of one of the units randomly
        const { country, lat, lon, alt } = randomUnit

        const unitDeathPosition: PositionLL = { lat, lon, alt }

        const [firstOnRoadPosition, lastOnRoadPosition]: [
          PositionLL,
          PositionLL
        ] = await Promise.all([
          closestPointOnRoads(RoadType.Roads, spawnerPosition),
          closestPointOnRoads(RoadType.Roads, unitDeathPosition),
        ])

        // MUST remove them from the db first, to avoid issues with concurrently spawning being marked gone
        // mark the spawnerQueue items for these units as done
        await Promise.all(
          unitsToSpawn.map(async unit => {
            const { unitId, spawnerId } = unit

            await spawnerQueueDone(spawnerId, unitId)
          })
        )

        const path = await findPathOnRoads(
          RoadType.Roads,
          firstOnRoadPosition,
          lastOnRoadPosition
        )

        // spawn the units in a circle on the position
        const groups = await spawnGroundUnitsInCircle(
          country,
          spawnerPosition,
          SPAWNER_UNIT_RANDOM_FOCUS_RADIUS,
          unitsToSpawn
        )

        // we have to wait a short delay after spawning a unit before giving it tasks
        await new Promise(resolve => setTimeout(resolve, 100))

        // drive the spawned group(s) to the death position
        await Promise.all(
          groups.map(async ({ groupName }) => {
            await driveGroundGroup({
              groupName,
              position: spawnerPosition,
              // TODO: improve points logic here to make pathing of spawned units less.. dumb
              // use path if it has points, otherwise use the first and last onroad points
              points:
                path.length > 0
                  ? path
                  : [firstOnRoadPosition, lastOnRoadPosition],
              destination: unitDeathPosition,
              onroad: false,
            })
          })
        )

        // TODO: if the above errors, null out the doneAt value again to give it an attempt to respawn
      })
    )
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
  const unit = await findUnit(event.unit.name)

  if (!unit) {
    throw new Error('gone unit not found in db, or already destroyed/gone')
  }

  if (isPlayerUnit(unit)) {
    // quietly no-op on player slots
    // player slots shouldn't auto respawn
    return
  }

  const { country, unitId, position, typeName } = unit

  // look for nearby spawners of matching coalition
  const foundNearbyCoalitionSpawners = await nearbySpawners({
    position,
    accuracy: UNIT_MAXIMUM_DISPLACEMENT_TO_SPAWNER_METERS,
    coalition: coalitionFrom(country),
  })

  const firstSpawner = foundNearbyCoalitionSpawners[0]

  if (!firstSpawner) {
    throw new Error('no spawner found in range')
  }

  const { spawnerId } = firstSpawner

  // add unit to respawn queue if spawner nearby
  await Promise.all([
    unitDestroyed(unit),
    insertSpawnerQueue(spawnerId, unitId),
  ])

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

      const { position } = addedMark

      const spawnersNearby = await nearbySpawners({
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

      const spawner = {
        coalition,
        position: addedMark.position,
        type: spawnerType,
      }

      const spawnerId = await insertSpawner(spawner)

      await removeMapMark(addedMark.id)
      await addMarkerForSpawner({ ...spawner, spawnerId })
      await outText(`Spawner ${spawnerId} created`)
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

      const foundSpawners = await nearbySpawners({
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
        foundSpawners.map(async element => {
          const { lat, lon, alt } = element
          const spawnerPosition = { lat, lon, alt }
          if (
            distanceFrom(markPosition, spawnerPosition) <=
            (command.radius || DESTROY_SINGLE_UNIT_SEARCH_RANGE)
          ) {
            const { spawnerId } = element
            await spawnerDestroyed(spawnerId) // destroy

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
  spawner: Pick<Spawner & DBSpawner, 'type' | 'coalition' | 'spawnerId'>
): string {
  const { coalition, spawnerId, type } = spawner
  return `
${generatedBanner}
Id: ${spawnerId}
Coalition: ${coalition}
Type: ${type}
`.trim() // use trim here to remove the newlines before and after
}
