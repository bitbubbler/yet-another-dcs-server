import { coalitionFrom } from '../coalition'
import { emFork } from '../db/connection'
import { CargoSuperType, Csar, CsarCargo, Player, Position, Unit } from '../db'
import {
  Events,
  EventType,
  GroupCommandEvent,
  LandEvent,
  PilotDeadEvent,
} from '../events'
import { netPlayerFrom } from '../player'
import {
  allCsars,
  createCsar,
  findNearbyCsars,
  pickupCsar,
  smokeCsar,
  spawnCsar,
} from '../csar'
import { outCoalitionText, outGroupText } from '../trigger'
import { humanReadableGridSquare, positionMGRSFrom } from '../coord'
import { LatLon } from '../geo'
import { distanceFrom, randomBetween, waitForTime } from '../common'
import { unitInAir, unitIsAlive } from '../unit'
import { driveGroundGroup, Group, groupFromGroupName } from '../group'
import { unloadCargo } from '../cargo'
import { baseTypeDisplayNameShort, findNearbyBases } from '../base'
import { CommandType } from '../commands'

/** The range a heilcopter can pickup a csar from, in meters */
const CSAR_PICKUP_RANGE_METERS = 60
/** The distance a downed pilot will run to  */
const CSAR_DOWNED_PILOT_RUN_DISTANCE_METERS = 500
/** The maximum dsitance from a base downed pilots can be dropped off */
const CSAR_DROP_OFF_RANGE_METERS = 150
/** The maximum amuont of time a pilot should wait for a downed pilot to run to them */
const CSAR_MAX_LOAD_TIME = 120
/** The range a csar can see a unit from, in meters. At this distance csar make a "Radio call" when you get in range */
const CSAR_VISIBILITY_RANGE_METERS = 3000
/** The range at which csar will deploy smoke for a unit, in meters */
const CSAR_SMOKE_RANGE_METERS = 8000

type UnitsOnDuty = Set<Unit['unitId']>
type InRangeMessages = Map<Unit['unitId'], Set<Csar['csarId']>>
type DownedPilotMoveTimes = Map<string, number>

export async function searchAndRescueMain(): Promise<() => Promise<void>> {
  const em = await emFork()
  const unitRepository = em.getRepository(Unit)

  // TODO: ensure csar are spawned on backend start
  await Promise.all(
    (await allCsars()).map(async csar => {
      await spawnCsar(csar)
    })
  )

  /**
   * A collection of units marked as on-duty. This should not persist
   * (if the server resets/restarts units have to go on-duby again with f10 menu)
   */
  const unitsOnDuty: UnitsOnDuty = new Set()
  /**
   * A record of unit/csar combinations that we have sent "you're close" messages to
   * This allows us to not annoy pilots with repeated messages.
   */
  const inRangeMessages: InRangeMessages = new Map()
  const downedPilotMoveTimes: DownedPilotMoveTimes = new Map()

  // a simple shutdown signal for the check loop
  let exit = false

  const handleGroupCommand = getHandleGroupCommand({ unitsOnDuty })

  // start a game loop that checks nearby csar and loads helis
  async function checkCsar() {
    // exit this loop using a dumb signal
    if (exit === true) {
      return
    }

    try {
      // check if any onduty player units are nearby a csar unit
      const units = await unitRepository.find({
        unitId: { $in: Array.from(unitsOnDuty.values()) },
      })

      await Promise.all(
        units.map(async unit => {
          const { name, country, position } = unit
          const coalition = coalitionFrom(country)
          const group = await groupFromGroupName(name)

          if (!group) {
            return
          }

          const nearbyCsars = await findNearbyCsars({
            accuracy: CSAR_VISIBILITY_RANGE_METERS,
            coalition,
            position,
          })

          await Promise.all([
            handleNearbyMessage({ nearbyCsars, group, inRangeMessages, unit }),
          ])

          for (const csar of nearbyCsars) {
            if (!csar.unit || !csar.marker) {
              // unit is already picked up or KIA
              return
            }
            const moveTimesKey = JSON.stringify([unit.unitId, csar.csarId])
            const time = downedPilotMoveTimes.get(moveTimesKey)
            // use the ingame csar units position
            const distance = distanceFrom(unit.position, csar.unit.position)

            const [isAlive, isInAir] = await Promise.all([
              unitIsAlive(unit),
              unitInAir(unit),
            ])

            if (isAlive === false || isInAir === true) {
              // if the pilot takes off while a csar is running
              if (typeof time === 'number') {
                // unset time, and send the unit back to it's marker
                downedPilotMoveTimes.delete(moveTimesKey)
                await driveGroundGroup({
                  destination: csar.position,
                  groupName: csar.unit.name,
                  onroad: false,
                  points: [],
                  position: csar.position,
                })
                await outGroupText(
                  group.id,
                  `Downed Pilot ${csar.player.name}: Don't leave me here!`,
                  time
                )
              }
              return
            }

            if (distance < CSAR_DOWNED_PILOT_RUN_DISTANCE_METERS) {
              if (distance < CSAR_PICKUP_RANGE_METERS) {
                // clear the timer
                downedPilotMoveTimes.delete(moveTimesKey)
                // pickup the csar immediately
                await pickupCsar(group, unit, csar)
                // continue
                continue
              }
              if (typeof time !== 'number') {
                const downedPilotMoveTime = Math.floor(
                  (distance * CSAR_MAX_LOAD_TIME) /
                    CSAR_DOWNED_PILOT_RUN_DISTANCE_METERS
                )
                downedPilotMoveTimes.set(moveTimesKey, downedPilotMoveTime)
                await driveGroundGroup({
                  destination: unit.position,
                  groupName: csar.unit.name,
                  onroad: false,
                  points: [],
                  position: csar.position,
                })
                await outGroupText(
                  group.id,
                  `Downed Pilot ${csar.player.name}: Alright, let me get in! (${downedPilotMoveTime} seconds..)`,
                  time
                )
                continue
              }
              if (time <= 0) {
                // clear the timer
                downedPilotMoveTimes.delete(moveTimesKey)
                // pickup immediately
                await pickupCsar(group, unit, csar)
              } else {
                // decrement time
                downedPilotMoveTimes.set(moveTimesKey, time - 1)
              }
            }

            // TODO: hover logic; https://github.com/ciribob/DCS-CSAR/blob/master/CSAR.lua#L1297-L1332
          }
        })
      )
    } catch (error) {
      console.log('csar check failed', error)
    }

    await waitForTime(1000) // wait 1 second
    await checkCsar() // do it again
  }

  // kick off the loop (this will run itself recursively)
  checkCsar()

  const subscription = Events.subscribe(async event => {
    const { type } = event
    if (EventType.PilotDead === type) {
      return handlePilotDead(event)
    }
    if (EventType.Land === type) {
      return handleLand(event)
    }
    if (EventType.Takeoff === type) {
      //
    }
    if (EventType.GroupCommand === type) {
      return handleGroupCommand(event)
    }
  })

  return async () => {
    exit = true
    subscription.unsubscribe()
  }
}

function getHandleGroupCommand({ unitsOnDuty }: { unitsOnDuty: UnitsOnDuty }) {
  return async function handleGroupCommand(
    event: GroupCommandEvent
  ): Promise<void> {
    // do NOT put `emFork()` up here!!
    // We should not fork on every command, only on the commands that requires db interactions
    const { command, group } = event
    const { type } = command

    if (CommandType.CsarGoOnDuty === type) {
      const em = await emFork()
      const unitRepository = em.getRepository(Unit)
      const unit = await unitRepository.findOneOrFail({ name: group.name })

      unitsOnDuty.add(unit.unitId)

      outGroupText(group.id, ``)
    }
    if (CommandType.CsarGoOffDuty === type) {
      const em = await emFork()
      const unitRepository = em.getRepository(Unit)
      const unit = await unitRepository.findOneOrFail({ name: group.name })

      unitsOnDuty.delete(unit.unitId)
    }
    if (CommandType.CsarRequestSmoke === type) {
      const em = await emFork()
      const unitRepository = em.getRepository(Unit)
      const unit = await unitRepository.findOneOrFail({ name: group.name })

      const { coalition, position } = unit

      const nearbyCsars = await findNearbyCsars({
        accuracy: CSAR_SMOKE_RANGE_METERS,
        coalition,
        position,
      })

      if (nearbyCsars.length < 1) {
        await outGroupText(
          group.id,
          `There are no downed pilots within ${CSAR_SMOKE_RANGE_METERS} meters`
        )
        return
      }

      // only smoke the closes csar
      const csar = nearbyCsars[0]

      await smokeCsar(csar)

      const bearing = Math.floor(
        new LatLon(unit.position.lat, unit.position.lon).initialBearingTo(
          new LatLon(csar.position.lat, csar.position.lon)
        )
      )

      await outGroupText(
        group.id,
        `Downed Pilot ${csar.player.name}: I'm popping blue smoke at your ${bearing}!`
      )
    }
    if (CommandType.CsarCheckOnboard === type) {
      const em = await emFork()
      const unitRepository = em.getRepository(Unit)
      const unit = await unitRepository.findOneOrFail(
        { name: group.name },
        {
          populate: ['cargos', 'cargos.csar'],
          populateWhere: { cargos: { csar: { $exists: true } } },
        }
      )

      const csarCargos = Array.from(unit.cargos).filter(
        (cargo): cargo is CsarCargo => CargoSuperType.Csar === cargo.superType
      )

      await outGroupText(
        group.id,
        `
Onboard Downed Pilots:${csarCargos.map(cargo => {
          const csar = cargo.csar

          return `\n${csar.player.name} of ${csar.diedUnit.name}`
        })}
`.trim()
      )
    }
  }
}

async function handleLand(event: LandEvent): Promise<void> {
  const em = await emFork()
  const unitRepository = em.getRepository(Unit)
  const { unit: gameUnit } = event

  if (gameUnit.playerName && gameUnit.playerName.length > 0) {
    // if landed at a base, unload csar
    const unit = await unitRepository.findOneOrFail({ name: gameUnit.name })
    const coalition = coalitionFrom(gameUnit.country)

    // populate unit cargos
    await unit.cargos.loadItems()

    for (const cargo of unit.cargos) {
      if (CargoSuperType.Csar !== cargo.superType) {
        return
      }

      // check if base nearby
      const nearbyBases = await findNearbyBases({
        accuracy: CSAR_DROP_OFF_RANGE_METERS,
        coalition,
        position: gameUnit.position,
      })

      // if we're not near a base, do nothing
      if (nearbyBases.length < 1) {
        return
      }

      const base = nearbyBases[0]

      await em.populate(cargo, ['csar'])

      // otherwise unload the csar cargos
      const csar = cargo.csar

      // broadcast the csar rescue
      await outCoalitionText(
        coalition,
        `${unit.name} has rescued downed pilot ${csar.player.name} of ${
          csar.diedUnit.name
        } at ${baseTypeDisplayNameShort(base.type)} ${base.name}`
      )

      await unloadCargo(unit, cargo)

      // mark the csar as rescued
      csar.rescued()

      // flush changes
      await em.flush()
    }
  }
}

async function handlePilotDead(event: PilotDeadEvent): Promise<void> {
  const { unit: gameUnit } = event

  if (gameUnit.playerName && gameUnit.playerName.length > 0) {
    const em = await emFork()
    const unitRepository = em.getRepository(Unit)
    const playerRepository = em.getRepository(Player)

    const unit = await unitRepository.findOne({ name: gameUnit.name })

    // confirm the unit is a player slot (it should be)
    if (!unit?.isPlayerSlot) {
      // we don't make csar for non-player slots
      return
    }

    const { country } = unit

    const coalition = coalitionFrom(country)

    const { ucid } = await netPlayerFrom(gameUnit.playerName)

    const player = await playerRepository.findOneOrFail(
      { ucid },
      {
        failHandler: (): Error =>
          new Error(`Failed to find Player by ucid. ucid='${ucid}'`),
      }
    )

    const { lat, lon } = new LatLon(
      gameUnit.position.lat,
      gameUnit.position.lon
    ).destinationPoint(
      randomBetween(15, 50), // random distance
      randomBetween(0, 360) // random heading
    )

    const position = new Position({ lat, lon, alt: 0, heading: 0 })

    // create the csar
    const csar = await createCsar({
      coalition,
      player,
      position,
      diedUnit: unit,
    })

    // spawn the csar
    await spawnCsar(csar)

    const gridSquare = humanReadableGridSquare(await positionMGRSFrom(position))

    // broadcast the new csar
    await outCoalitionText(
      coalition,
      `A pilot has gone down and needs rescue in ${gridSquare}`
    )
  }
}

async function handleNearbyMessage({
  nearbyCsars,
  inRangeMessages,
  unit,
  group,
}: {
  nearbyCsars: Csar[]
  inRangeMessages: InRangeMessages
  unit: Unit
  group: Group
}) {
  const { unitId } = unit
  const inRangeMessage = inRangeMessages.get(unitId) || new Set()

  if (nearbyCsars.length < 1) {
    inRangeMessage.clear()
    return // nothing to do for this unit
  }

  for (const csar of nearbyCsars) {
    if (!csar.unit) {
      // unit is already picked up or KIA
      continue
    }

    if (inRangeMessage.has(csar.csarId)) {
      continue
    }

    // send a message about being nearby, but don't wait for it
    outGroupText(
      group.id,
      `Downed Pilot ${csar.player.name}: You sound close, let me know if I should pop smoke!`
    )
  }

  // reset the sent messages set to currently nearby csar
  // theory: as long as the csar stays in range, we won't send another message
  inRangeMessage.clear()
  for (const csar of nearbyCsars) {
    inRangeMessage.add(csar.csarId)
  }

  inRangeMessages.set(unitId, inRangeMessage)
}
