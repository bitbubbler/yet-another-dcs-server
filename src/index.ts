import { backOff } from 'exponential-backoff'

import { getAvailableSlots, Slot, SlotID } from './dcs'

// dependencies
import { address, services } from './services'
import { prepare as prepareDatabase } from './db/db'
import { Restarts } from './signals'

// building blocks
import { startEvents } from './events'
import { GroupMenu, menusMain, MissionMenu } from './menus'
import { pingpong } from './pingpong'
import { startUnitEvents } from './unitEvents'

// bigger things
import { spawnUnitsMain, spawnUnitsMenu } from './spawnUnits'
import { persistenceMain } from './persistence'
import { restartMissionMain, restartMissionMenu } from './restartMission'
import { visualMarkersMain } from './visualMarkers'
import { autoRespawnMain, spawnersMenu } from './autoRespawn'

// const missionCoalitions = new Set<> // TODO
const missionSlots = new Map<SlotID, Slot>()

// NOTE: The order of menus in this array determines their order on the client
const missionMenus: MissionMenu[] = [spawnersMenu, restartMissionMenu]
const groupMenus: GroupMenu[] = [spawnUnitsMenu]

async function main() {
  // things here only happen once
  // prepare the database
  await prepareDatabase()

  await start()

  // things inside here happen every time we disconnect/restart due to an error
  async function setupMission(): Promise<() => Promise<void>> {
    console.log(`connecting to ${address}`)
    await services.ready()
    console.log(`connected`)

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

    // load the menus
    const teardownMenus = await menusMain(missionMenus, groupMenus)

    // bootstrap our functional modules
    const teardownSpawnUnits = await spawnUnitsMain()
    const teardownPersistence = await persistenceMain()
    const teardownRestartMission = await restartMissionMain()
    const teardownVisualMarkers = await visualMarkersMain()
    const teardownAutoRespawn = await autoRespawnMain()

    return async () => {
      await teardownPingpong()
      await teardownSpawnUnits()
      await teardownPersistence()
      await teardownRestartMission()
      await teardownVisualMarkers()
      await teardownAutoRespawn()
      await teardownMenus()
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
