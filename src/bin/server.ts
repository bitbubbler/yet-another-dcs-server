import { backOff } from 'exponential-backoff'

// dependencies
import { services } from '../services'
import { Restarts } from '../signals'

// building blocks
import { startEvents } from '../events'
import { GroupMenu, menusMain, MissionMenu } from '../menus'
import { pingpong } from '../pingpong'
import { startUnitEvents } from '../unitEvents'

// bigger things
import { spawnUnitsMain } from '../spawnUnits'
import { persistenceMain } from '../persistence'
import { restartMissionMain, restartMissionMenu } from '../restartMission'
import { visualMarkersMain } from '../visualMarkers'
import { autoRespawnMain, spawnersMenu } from '../autoRespawn'
import { logisticsMain, internalCargoMenu } from '../logistics'
import { orm } from '../db'

// NOTE: The order of menus in this array determines their order on the client
const missionMenus: MissionMenu[] = [spawnersMenu, restartMissionMenu]
const groupMenus: GroupMenu[] = [internalCargoMenu]

async function main(): Promise<void> {
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

async function handleExit() {
  const ormActual = await orm

  await ormActual.close()

  process.exit(0)
}

// shutdown/exist signals
process.on('SIGINT', handleExit)
process.on('SIGQUIT', handleExit)
process.on('SIGTERM', handleExit)
