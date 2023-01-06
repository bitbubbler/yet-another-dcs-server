import {
  BaseCargo,
  Cargo,
  CargoSuperType,
  NewCargo,
  Unit,
  UnitCargo,
} from './db'
import { setUnitInternalCargoMass } from './unit'
import { entityManager, orm } from './db'
import { wrap } from '@mikro-orm/core'

export async function createCargo(newCargo: NewCargo): Promise<Cargo> {
  const { superType } = newCargo

  if (CargoSuperType.Base === superType) {
    const baseCargo = new BaseCargo(newCargo)

    await entityManager(await orm)
      .persist(baseCargo)
      .flush()

    return baseCargo
  }
  if (CargoSuperType.Unit === superType) {
    const unitCargo = new UnitCargo(newCargo)

    await entityManager(await orm)
      .persist(unitCargo)
      .flush()

    return unitCargo
  }

  throw new Error('attempted to create an unknown cargo superType')
}

/**
 * Load a cargo onto a unit, for transport
 *
 * IMPORTANT: while any unit can carry cargo, only player units will emulate mass (dcs limitation)
 * @param unit the unit to carry the cargo
 * @param cargo the cargo to be loaded
 */
export async function loadCargo(unit: Unit, cargo: Cargo): Promise<void> {
  const em = entityManager(await orm)

  unit.cargos.add(wrap(cargo).toReference())

  await em.persistAndFlush(unit)

  // set unit weight in dcs
  await setUnitInternalCargoMass(unit, cargo.mass)
}

/**
 * Un-load a cargo from a unit
 *
 * IMPORTANT: while any unit can carry cargo, only player units will emulate mass (dcs limitation)
 * @param unit the unit to carry the cargo
 * @param cargo the cargo to be unloaded
 */
export async function unloadCargo(unit: Unit, cargo: Cargo): Promise<void> {
  const em = entityManager(await orm)

  await em.removeAndFlush(cargo)

  // set unit weight in dcs
  await setUnitInternalCargoMass(unit, 0)
}

export async function destroyCargo(cargo: Cargo): Promise<void> {
  await entityManager(await orm)
    .remove(cargo)
    .flush()
}

export function isBaseCargo(cargo: Cargo): cargo is BaseCargo {
  return cargo.superType === CargoSuperType.Base
}

export function isUnitCargo(cargo: Cargo): cargo is UnitCargo {
  return cargo.superType === CargoSuperType.Unit
}
