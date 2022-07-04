import { equal } from 'assert'

import { Coalition } from '../../generated/dcs/common/v0/Coalition'
import { Events, EventType, MarkChangeEvent } from '../events'
import { outText } from '../trigger'

import { getMarkById } from '../custom'
import { CommandType } from '../commands/types'
import { insertSpawner, nearbySpawners, spawnerDestroyed } from '../db/spawners'
import { Spawner, SpawnerType } from './types'
import { randomBetween } from '../common'
import { knex, SpawnerQueue } from '../db'
import { PositionLL } from '../types'
import { spawnGroundUnitsInCircle } from '../unit'
import { spawnerQueueDone } from '../db/spawnerQueues'

const SPAWNER_MINIMUM_DISPLACEMENT_METERS = 250
const SPAWNER_MAXIMUM_UNITS_PER_CYCLE = 2 // (per spawner)
const SPAWNER_UNIT_RANDOM_FOCUS_RADIUS = 50
const SPAWNER_DETECT_CAPTURE_INTERVAL_SECONDS = 5

export async function autoRespawnMain(): Promise<() => Promise<void>> {
  const subscription = Events.subscribe(async event => {
    if (EventType.MarkChange === event.type) {
      return handleMarkChangeEvent(event as MarkChangeEvent)
    }
  })

  const teardownRespawnQueue = respawnQueue()
  const teardownDetectCapture = detectCapture()

  // teardown function
  return async () => {
    subscription.unsubscribe()
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
      .select<
        Array<Pick<Spawner & SpawnerQueue, 'spawnerId'> & { depth: number }>
      >(['spawnerId', 'COUNT(unitId) as depth'])
      .whereNull('doneAt')
      .groupBy('spawnerId')
      .orderBy('createdAt', 'asc')

    console.log(`waiting spawner ids`, spawnersQueued)

    // lookup and spawn units for all spawners concurrently
    await Promise.all(
      spawnersQueued.map(async ({ spawnerId, depth }) => {
        console.log(
          `Attempting to spawn ${SPAWNER_MAXIMUM_UNITS_PER_CYCLE} units for spawner ${spawnerId}. Spawner has a queue depth of ${depth}`
        )

        const unitsToSpawn = await knex('units')
          .leftOuterJoin('positions', function () {
            this.on('units.positionId', '=', 'positions.positionId')
          })
          .leftOuterJoin('spawners', function () {
            this.on('units.unitId', '=', 'spawnQueues.unitId')
          })
          .select([
            'spawnerId',
            'unitId',
            'typeName',
            'country',
            'lat',
            'lon',
            'alt',
          ])
          .where({ spawnerId })
          .limit(SPAWNER_MAXIMUM_UNITS_PER_CYCLE)

        const randomUnit =
          unitsToSpawn[randomBetween(1, unitsToSpawn.length) - 1]

        if (!randomUnit) {
          throw new Error('Attempt to randomly pick a unit failed')
        }

        // use the position of one of the units randomly
        const { country, lat, lon, alt } = randomUnit

        // TODO: fix coalition (only spawn units matching the spawners coalition)

        const position: PositionLL = { lat, lon, alt }

        // spawn the units in a circle on the position
        await spawnGroundUnitsInCircle(
          country,
          position,
          SPAWNER_UNIT_RANDOM_FOCUS_RADIUS,
          unitsToSpawn
        )

        // mark the spawnerQueue items for these units as done
        await Promise.all(
          unitsToSpawn.map(async unit => {
            const { unitId, spawnerId } = unit

            await spawnerQueueDone(spawnerId, unitId)
          })
        )
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
    queueTimeout = setTimeout(respawnUnits, randomQueueTime())
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

async function handleMarkChangeEvent(event: MarkChangeEvent) {
  const { id, command } = event

  // attempt to handle command(s) from markers
  if (command) {
    if (CommandType.CreateSpawner === command.type) {
      const {
        coalition = Coalition.COALITION_NEUTRAL,
        spawnerType = SpawnerType.Easy,
      } = command
      const addedMark = await getMarkById(id)

      if (!addedMark) {
        throw new Error('expected addedMark')
      }

      // make sure spawner meets minimum displacement requirement
      equal(
        (
          await nearbySpawners(
            addedMark.position,
            SPAWNER_MINIMUM_DISPLACEMENT_METERS
          )
        ).length,
        0,
        'Too many nearby spawners'
      )

      const spawnerId = await insertSpawner({
        coalition,
        position: addedMark.position,
        type: spawnerType,
      })

      await outText(`Spawner ${spawnerId} created`)
    }
    if (CommandType.Destroy === command.type) {
      const addedMark = await getMarkById(id)

      if (!addedMark) {
        throw new Error('expected addedMark')
      }

      // make sure spawner meets minimum displacement requirement
      const nearby = await nearbySpawners(
        addedMark.position,
        SPAWNER_MINIMUM_DISPLACEMENT_METERS
      )

      equal(nearby.length > 0, true, 'No existing spawners found')

      const [{ spawnerId }] = nearby

      await spawnerDestroyed(spawnerId) // destroy

      await outText(`Spawner ${spawnerId} destroyed`)
    }
  }
}
