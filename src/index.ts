import { backOff } from 'exponential-backoff'

import { getAvailableSlots, Slot, SlotID } from './dcs'

// dependencies
import { address, services } from './services'
import { prepare as prepareDatabase } from './db/db'

// building blocks
import { Events, startEvents } from './events'
import { startUnitEvents, UnitEvents } from './unitEvents'
import { pingpong } from './pingpong'

// bigger things
import { spawnUnitsMain } from './spawnUnits/main'
import { persistenceMain } from './persistence/main'
import { restartMissionMain, Restarts } from './restartMission/main'
import { visualMarkersMain } from './visualMarkers/main'

// const missionCoalitions = new Set<> // TODO
const missionSlots = new Map<SlotID, Slot>()

async function main() {
  // things here only happen once
  // prepare the database
  await prepareDatabase()

  await start()

  // things inside here happen every time we disconnect/restart due to an error
  async function setupMission(): Promise<() => Promise<void>> {
    console.log(`connecting to ${address}`)
    await services.ready()

    // load mission slots
    const slots = await getSlots()
    slots.forEach(slot => {
      const slotId = slot.unitId
      missionSlots.set(slotId, slot)
    })

    // a pingpong for issue and latency detection
    const teardownPingpong = pingpong()

    // start streaming events
    startEvents()
    startUnitEvents()

    // bootstrap our functional modules
    const teardownSpawnUnits = await spawnUnitsMain()
    const teardownPersistence = await persistenceMain()
    const teardownRestartMission = await restartMissionMain()
    const teardownVisualMarkers = await visualMarkersMain()

    return async () => {
      await teardownPingpong()
      await teardownSpawnUnits()
      await teardownPersistence()
      await teardownRestartMission()
      await teardownVisualMarkers()
    }
  }

  async function start() {
    backOff(
      async () => {
        const teardown = await setupMission()

        const subscription = Restarts.subscribe(async () => {
          subscription.unsubscribe()
          await teardown()
          await start()
        })
      },
      {
        delayFirstAttempt: false,
        retry: error => {
          console.log('Startup failed', error)
          console.log('Retrying...')
          return true
        },
        jitter: 'full',
        maxDelay: 1000 * 10,
        numOfAttempts: Infinity,
      }
    )
  }
}

main().catch(error => {
  console.log('big bad', error)
})

async function getSlots(): Promise<Slot[]> {
  const allSlots = await Promise.all([
    getAvailableSlots('red'),
    getAvailableSlots('blue'),
  ])

  return allSlots.reduce((previous, current) => previous.concat(current), [])
}

process.on('uncaughtException', function (err) {
  console.log(err)
})
