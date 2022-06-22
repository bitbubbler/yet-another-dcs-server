import { getAvailableSlots, Slot, SlotID } from './dcs'
import { address, services } from './services'
import { Events, startEvents } from './events'
import { startUnitEvents, UnitEvents } from './unitEvents'
import { main as spawnUnitsMain } from './spawnUnits/main'
import { main as persistenceMain } from './persistence/main'
import { main as restartMissionMain, Restarts } from './restartMission/main'
import { prepare as prepareDatabase } from './db/db'
import { pingpong } from './pingpong'

// const missionCoalitions = new Set<> // TODO
const missionSlots = new Map<SlotID, Slot>()

async function main() {
  // prepare the database
  await prepareDatabase()

  await start()

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

    return async () => {
      await teardownPingpong()
      await teardownSpawnUnits()
      await teardownPersistence()
      await teardownRestartMission()
    }
  }

  async function start() {
    const teardown = await setupMission()

    let restarted = false

    async function restart() {
      if (restarted) {
        // only allow one restart
        // scoping will reset thing on next start
        return
      }
      restarted = true
      try {
        await teardown()
        await start()
      } catch (error) {
        console.log('restarting error, trying again', error)
        await start()
      }
    }

    Events.subscribe({
      error() {
        restart()
      },
    })
    UnitEvents.subscribe({
      error() {
        restart()
      },
    })
    Restarts.subscribe(() => restart())
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
