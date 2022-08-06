import { Cargo } from '../cargo'
import { Unit } from '../unit'
import { cargoFrom } from './cargos'
import { knex } from './db'

export async function insertUnitCargo(unit: Unit, cargo: Cargo): Promise<void> {
  const { unitId } = unit
  const { cargoId } = cargo

  await knex('unitCargos').insert({ cargoId, unitId })
}

export async function deleteUnitCargo(unit: Unit, cargo: Cargo): Promise<void> {
  const { unitId } = unit
  const { cargoId } = cargo

  await knex('unitCargos')
    .where({
      unitId,
      cargoId,
    })
    .delete()
}

export async function findUnitCargo(unit: Unit): Promise<Cargo | undefined> {
  const { unitId } = unit

  const foundCargo = await knex('cargos')
    .select('*')
    .innerJoin('unitCargos', 'cargos.cargoId', 'unitCargos.cargoId')
    .innerJoin('positions', 'cargos.positionId', 'positions.positionId')
    .where('unitCargos.unitId', unitId)
    .whereNull('goneAt')
    .first()

  if (foundCargo) {
    return cargoFrom(foundCargo)
  }
  return undefined
}
