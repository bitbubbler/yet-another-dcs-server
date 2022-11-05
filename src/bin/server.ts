import { backOff } from 'exponential-backoff'

// dependencies
import { services } from '../services'
import { prepare as prepareDatabase } from '../db/db'
import { Restarts } from '../signals'

// building blocks
import { startEvents } from '../events'
import { GroupMenu, menusMain, MissionMenu } from '../menus'
import { pingpong } from '../pingpong'
import { startUnitEvents } from '../unitEvents'

// bigger things
import { spawnUnitsMain, spawnUnitsMenu } from '../spawnUnits'
import { persistenceMain } from '../persistence'
import { restartMissionMain, restartMissionMenu } from '../restartMission'
import { visualMarkersMain } from '../visualMarkers'
import { autoRespawnMain, spawnersMenu } from '../autoRespawn'
import { logisticsMain, internalCargoMenu } from '../logistics'
import { getPlayerSlots } from '../player'
import { findUnit } from '../db'
import { createUnit } from '../unit'

// NOTE: The order of menus in this array determines their order on the client
const missionMenus: MissionMenu[] = [spawnersMenu, restartMissionMenu]
const groupMenus: GroupMenu[] = [internalCargoMenu, spawnUnitsMenu]

async function main(): Promise<void> {
  // things here only happen once
  // prepare the database
  await prepareDatabase()

  await start()

  // things inside here happen every time we disconnect/restart due to an error
  async function setupMission(): Promise<() => Promise<void>> {
    await services.ready()

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
    const teardownLogisticsMain = await logisticsMain()

    // load player slots (player slots can change if the mission changes)
    // TODO: make this a module or something
    // it's not really a module because we only ever want it to run once..
    ;(async function () {
      const slots = await getPlayerSlots()

      for (const slot of slots) {
        const {
          country,
          groupName,
          multicrew_place: multicrewPlace,
          type,
        } = slot

        // ignore multicrew slots (copilot and gunner slots)
        if (multicrewPlace > 1) {
          continue
        }
        // ignore slots without a groupName (game master and tac commander clots)
        if (!groupName) {
          continue
        }

        const name = `${groupName}-1`

        const existingUnit = await findUnit(name)

        // ignore existing units
        if (existingUnit) {
          continue
        }

        // create a new unit for this slot
        await createUnit({
          country,
          isPlayerSlot: true,
          name,
          // initial heading and position for player units is 0(s)
          heading: 0,
          position: {
            alt: 0,
            lat: 0,
            lon: 0,
          },
          typeName: type,
        })
      }
    })()

    return async () => {
      await teardownPingpong()
      await teardownSpawnUnits()
      await teardownPersistence()
      await teardownRestartMission()
      await teardownVisualMarkers()
      await teardownAutoRespawn()
      await teardownLogisticsMain()
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

process.on('uncaughtException', function (err) {
  console.log(err)
})
