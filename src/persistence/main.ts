import { knex } from '../db'
import { groups as getGroups, getUnits } from '../group'
import { spawnGroundUnit, Unit } from '../unit'
import { UnitEventKind, UnitEvents } from '../unitEvents'
import { insertOrUpdateUnit, Position, Unit as UnitTable } from '../db'

export async function main(): Promise<() => Promise<void>> {
  await trySpawnUnits()

  // handle unit updates
  const subscription = UnitEvents.subscribe(async event => {
    if (UnitEventKind.Update === event.type) {
      const { unit } = event

      insertOrUpdateUnit(unit)
    }
    if (UnitEventKind.Gone === event.type) {
      // handle unit gone
      console.log('unit gone', event)
    }
  })

  return async () => {
    subscription.unsubscribe()
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

  // get the units in the mission
  const groups = await getGroups()

  const missionUnitNames: Unit['name'][] = []
  const missionUnits: Unit[] = []

  await Promise.all(
    groups.map(async group => {
      const { name } = group
      if (!name) {
        throw new Error('expected name on group')
      }

      try {
        const groupUnits = await getUnits(name)

        groupUnits.forEach(unit => {
          missionUnitNames.push(unit.name)
          missionUnits.push(unit)
        })
      } catch (error) {
        console.log('getting units for group failed', group, error)
      }
    })
  )

  // get the units in the db
  const dbUnits = await knex('units')
    .leftOuterJoin('positions', function () {
      this.on('units.positionId', '=', 'positions.positionId')
    })
    .whereNull('goneAt')
    .whereNull('destroyedAt')
    .select<
      Array<
        Pick<UnitTable, 'unitId' | 'name' | 'country' | 'typeName'> &
          Pick<Position, 'lat' | 'lon' | 'alt' | 'heading'>
      >
    >([
      'units.unitId',
      'name',
      'country',
      'typeName',
      'lat',
      'lon',
      'alt',
      'heading',
    ])

  // compare the lists to figure out what we should spawn
  const unitsToSpawn = dbUnits.filter(
    unit => missionUnitNames.includes(unit.name) === false
  )

  // spawn the missing units
  await Promise.all(
    unitsToSpawn.map(async unit => {
      const { unitId, name, country, typeName, lat, lon, heading } = unit

      await spawnGroundUnit({
        unitId,
        name,
        country,
        typeName,
        heading,
        position: {
          lat,
          lon,
        },
      })
    })
  )
}
