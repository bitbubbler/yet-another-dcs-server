import { emFork, orm } from '../db/connection'

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
import { Coalition } from '../__generated__/dcs/common/v0/Coalition'
import { AI } from '../ai'
import { autoRespawnMain, spawnersMenu } from '../autoRespawn'
import { createBase } from '../base'
import { countryFrom } from '../convert'
import { Base, BaseType, Unit, UnitTypeName } from '../db'
import { Game } from '../Game'
import { internalCargoMenu, logisticsMain } from '../logistics'
import { persistenceMain, trySpawnUnits } from '../persistence'
import { restartMissionMain, restartMissionMenu } from '../restartMission'
import { csarMenu, searchAndRescueMain } from '../searchAndRescue'
import { spawnUnitsMain } from '../spawnUnits'
import { createGroundUnit, spawnGroundUnit } from '../unit'
import { visualMarkersMain } from '../visualMarkers'

// NOTE: The order of menus in this array determines their order on the client
const missionMenus: MissionMenu[] = [spawnersMenu, restartMissionMenu]
const groupMenus: GroupMenu[] = [internalCargoMenu, csarMenu]

let shutdown = false

async function main(): Promise<void> {
  await start()

  // things inside here happen every time we disconnect/restart due to an error
  async function setupMission(): Promise<() => Promise<void>> {
    await services.ready()

    /*
      DELETE THE BELOW AFTER FINISHED REFACTORING
    */

    /**
     * Bootstrap things
     */
    // a pingpong for issue and latency detection
    const teardownPingpong = pingpong()

    // start streaming events
    startEvents()
    startUnitEvents()

    // TODO: this pattern sucks, replace it.
    // bootstrap our functional modules
    const teardownSpawnUnits = await spawnUnitsMain()
    const teardownPersistence = await persistenceMain()
    const teardownRestartMission = await restartMissionMain()
    const teardownVisualMarkers = await visualMarkersMain()
    const teardownAutoRespawn = await autoRespawnMain()
    const teardownLogisticsMain = await logisticsMain()
    const teardownSearchAndRescueMain = await searchAndRescueMain()

    /**
     * Startup Tasks
     */
    // load the menus
    const teardownMenus = await menusMain(missionMenus, groupMenus)
    // spawn the persisted units
    await trySpawnUnits()

    /*
      DELETE THE ABOVE AFTER FINISHED REFACTORING
    */

    // create the components
    const ai = new AI()

    // create the game class, injecting the components
    const game = new Game({
      ai,
    })

    // start the game
    game.start()

    // TESTING CODE

    const em = await emFork()
    const baseRepository = em.getRepository(Base)
    const unitRepository = em.getRepository(Unit)

    const [, unitCount] = await unitRepository.findAndCount({})

    if (unitCount < 1) {
      const unit = await createGroundUnit({
        country: countryFrom(Coalition.COALITION_BLUE),
        heading: 0,
        hidden: false,
        isPlayerSlot: false,
        position: {
          alt: 5,
          lat: 42.743,
          lon: 41.505,
        },
        typeName: UnitTypeName.HmmwvTow,
      })
      await spawnGroundUnit(unit)
    }

    const [, baseCount] = await baseRepository.findAndCount({})

    if (baseCount < 1) {
      await createBase({
        coalition: Coalition.COALITION_RED,
        heading: 0,
        position: {
          alt: 5,
          lat: 42.243,
          lon: 41.405,
        },
        type: BaseType.FARP,
      })
    }

    // END TESTING CODE

    return async function teardown() {
      game.shutdown()
      await teardownPingpong()
      await teardownSpawnUnits()
      await teardownPersistence()
      await teardownRestartMission()
      await teardownVisualMarkers()
      await teardownAutoRespawn()
      await teardownLogisticsMain()
      await teardownSearchAndRescueMain()
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
          if (shutdown) {
            return false
          }
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
  // mark shutdown
  shutdown = true

  try {
    const ormActual = await orm
    await ormActual.close()
    process.exit(0)
  } catch (error) {
    process.exit(1)
  }
}

// shutdown/exist signals
process.on('SIGINT', handleExit)
process.on('SIGQUIT', handleExit)
process.on('SIGTERM', handleExit)
