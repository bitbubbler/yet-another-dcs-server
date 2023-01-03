import { Base, knex } from './db'
import { equal } from 'assert'
import { Unit } from '../unit'
import { unitFrom } from './units'

export async function insertBaseUnit(
  baseId: Base['baseId'],
  unitId: Unit['unitId']
): Promise<void> {
  // insert position
  const insertPositionResult = await knex('baseUnits').insert({
    baseId,
    unitId,
  })

  // expect one result
  equal(insertPositionResult.length, 1)
}

export async function allBaseUnits(baseId: Base['baseId']): Promise<Unit[]> {
  const units = await knex('units')
    .innerJoin('positions', 'units.positionId', 'positions.positionId')
    .select('*')
    .whereIn('unitId', knex('baseUnits').select('unitId').where({ baseId }))

  return units.map(unitFrom)
}

export async function deleteBaseUnit(
  baseId: Base['baseId'],
  unitId: Unit['unitId']
): Promise<void> {
  await knex('baseUnits').where({ baseId, unitId }).delete()
}
