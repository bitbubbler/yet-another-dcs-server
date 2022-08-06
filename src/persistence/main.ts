import { findUnit, knex, unitFrom as unitFromDbUnit, unitGone } from '../db'
import { isPlayerUnit, spawnGroundUnit } from '../unit'
import { UnitEventType, UnitEvents } from '../unitEvents'
import { updateUnitPosition, Position, Unit as UnitTable } from '../db'

export async function persistenceMain(): Promise<() => Promise<void>> {
  await trySpawnUnits()

  // handle unit updates
  const subscription = UnitEvents.subscribe(async event => {
    /**
     * IMPORTANT: Player controlled units MAY NOT be persisted using this module.
     * Attempting to use the this persistence for player controlled units
     * will result in a bad time.
     *
     * Player controlled units are "slotted" into, and then a unit is spawned
     * for that player at the location of that slot in the mission file.
     * While having the location of the player is useful, that responsibility
     * does not belong to the persistence module, and should be done elsewhere.
     * Player controlled units are not gone forever, which persistence assumes.
     * Furthermore, two players can even re-use the same unit by re-slotting
     * as described above
     */
    if (UnitEventType.Update === event.type) {
      const { unit } = event

      try {
        await updateUnitPosition(unit)
      } catch (error) {
        // surpress failed position updates if a unit doesn't exist in the db
        if (/No known unit/.test((error as Error).message)) {
          return
        }
        throw error
      }
    }
    if (UnitEventType.Gone === event.type) {
      const name = event.unit.name
      const unit = await findUnit(name)

      if (typeof unit === 'undefined') {
        throw new Error(`MissingUnit: no unit found in db with name ${name}`)
      }

      // do not record gone events for player units
      // see the giant comment block above for details
      if (isPlayerUnit(unit) === false) {
        await unitGone(unit)
      }
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
    subscription.unsubscribe()
  }
}

/**
 * try to spawn units from the database (called on mission start and mission restart)
 */
async function trySpawnUnits() {
  // on startup, we need to attempt to syncronize mission state with database state
  // we can get more sophisticated, but for now we assume the database is the source of truth
  // this means that on restart, even if the mission hasn't reset, we'll reset the all units
  // to the position we have for each in the database

  // get the units in the db
  const unitsToSpawn = await knex('units')
    .leftOuterJoin('positions', function () {
      this.on('units.positionId', '=', 'positions.positionId')
    })
    .whereNull('goneAt')
    .whereNull('destroyedAt')
    .select<
      Array<
        Pick<
          UnitTable,
          'country' | 'isPlayerSlot' | 'name' | 'typeName' | 'unitId'
        > &
          Pick<Position, 'alt' | 'heading' | 'lat' | 'lon'>
      >
    >([
      'alt',
      'country',
      'heading',
      'isPlayerSlot',
      'lat',
      'lon',
      'name',
      'typeName',
      'units.unitId',
    ])

  // spawn the missing units
  await Promise.all(
    unitsToSpawn
      .map(unit => unitFromDbUnit(unit))
      .filter(unit => unit.isPlayerSlot === false)
      .map(async unit => {
        await spawnGroundUnit(unit)
      })
  )
}
