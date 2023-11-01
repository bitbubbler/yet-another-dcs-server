import { emFork } from '../db/connection'
import { Csar, Player, Unit, UnitTypeName } from '../db'
import { BirthEvent, Events, EventType } from '../events'
import { netPlayerFrom } from '../player'
import { createGroundUnit, isPlayerUnit, spawnGroundUnit } from '../unit'
import { UnitEventType, UnitEvents } from '../unitEvents'
import { countryFrom } from '../convert'
import { GamePositionLL } from '../types'

export async function persistenceMain(): Promise<() => Promise<void>> {
  const eventsSubscription = Events.subscribe(async event => {
    if (EventType.Birth === event.type) {
      return handleBirth(event)
    }
  })

  // handle unit updates
  const unitEventsSubscription = UnitEvents.subscribe(async event => {
    if (UnitEventType.Update === event.type) {
      const em = await emFork()
      const { orientation } = event.unit
      const { heading } = orientation
      const { lat, lon, alt } = event.unit.position
      const position: GamePositionLL = { lat, lon, alt }

      const qb = em.createQueryBuilder(Unit)
      qb.update({ heading, position }).where({ name: event.unit.name })

      // NOTE: this leaves a dangling position in the db, which is fine.
      // we should use these positions in the future to keep position history for debugging and replay
      await qb.execute()
      return
    }
    if (UnitEventType.Gone === event.type) {
      const em = await emFork()
      const unitRepository = em.getRepository(Unit)
      const csarRepository = em.getRepository(Csar)
      const name = event.unit.name
      const unit = await unitRepository.findOne({ name })

      if (!unit) {
        return
      }

      // do not record gone events for player units
      // see the giant comment block above for details
      if (isPlayerUnit(unit) === false) {
        unit.gone()

        // if the unit is a csar unit, mark the csar gone as well
        const csar = await csarRepository.findOne({
          unit: { unitId: unit.unitId },
        })

        if (csar) {
          // remove the marker
          if (csar.marker) {
            em.remove(csar.marker)
          }
          // remove the unit
          if (csar.unit) {
            em.remove(csar.unit)
          }
          // mark the csar as gone
          csar.gone()
        }

        em.flush()
      }
      return
    }
  })

  /**
   * cargos are special, they don't have a good api from dcs-grp and there isn't
   * an api in the scripting engine that gives us a good list of all cargos on the map
   * without being super expensive.
   *
   * To enable cargo persistence, we assume that all cargos are created and managed by
   * systems within this repo. This assumption allows us maintain persistence for
   * cargos because we CAN get information for a specifically named staticObject (using dcs apis)
   *
   * Along with the above assumption, each cargo gets it's own uuid that acts as the
   * identifier for doing lookups within the game engine
   */

  return async () => {
    eventsSubscription.unsubscribe()
    unitEventsSubscription.unsubscribe()
  }
}

async function handleBirth(event: BirthEvent) {
  if (!event.initiator.unit) {
    // no-op
    return
  }

  const { coalition, name, playerName, type } = event.initiator.unit
  const country = countryFrom(coalition)
  const typeName = type

  if (playerName && playerName.length > 0) {
    // create a player and a unit for the players slot, if it doesn't yet exist`
    try {
      const em = await emFork()
      const { ucid } = await netPlayerFrom(playerName)
      // player
      const player = new Player({
        name: playerName,
        ucid,
      })
      const { alt, lat, lon } = event.initiator.unit.position
      // unit (player slot)
      const position: GamePositionLL = { alt, lat, lon }

      await Promise.all([
        em.persistAndFlush(player),
        createGroundUnit({
          country,
          heading: 0,
          hidden: false,
          name,
          isPlayerSlot: true,
          position,
          typeName: typeName as UnitTypeName,
        }),
      ])
    } catch (err) {
      // silently ignore these
    }
  }
}

/**
 * try to spawn units from the database (called on mission start and mission restart)
 */
export async function trySpawnUnits() {
  // on startup, we need to attempt to syncronize mission state with database state
  // we can get more sophisticated, but for now we assume the database is the source of truth
  // this means that on restart, even if the mission hasn't reset, we'll reset the all units
  // to the position we have for each in the database

  const em = await emFork()
  const unitRepository = em.getRepository(Unit)
  const unitsToSpawn = await unitRepository.find({ isPlayerSlot: false })

  // spawn the missing units
  await Promise.all(
    unitsToSpawn.map(async unit => {
      await spawnGroundUnit(unit)
    })
  )
}
