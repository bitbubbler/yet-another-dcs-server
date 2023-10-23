import {
  BaseCargo,
  Cargo,
  CargoSuperType,
  CsarCargo,
  NewBaseCargo,
  NewCsarCargo,
  NewUnitCargo,
  Unit,
  UnitCargo,
} from './db'
import { setUnitInternalCargoMass } from './unit'
import { emFork } from './db/connection'

export async function createBaseCargo(
  newCargo: NewBaseCargo
): Promise<BaseCargo> {
  const baseCargo = new BaseCargo(newCargo)

  const em = await emFork()
  await em.persistAndFlush(baseCargo)

  return baseCargo
}

export async function createUnitCargo(
  newCargo: NewUnitCargo
): Promise<UnitCargo> {
  const unitCargo = new UnitCargo(newCargo)

  const em = await emFork()
  await em.persistAndFlush(unitCargo)

  return unitCargo
}
export async function createCsarCargo(
  newCargo: NewCsarCargo
): Promise<CsarCargo> {
  const csarCargo = new CsarCargo(newCargo)

  const em = await emFork()
  await em.persistAndFlush(csarCargo)

  return csarCargo
}

/**
 * Load a cargo onto a unit, for transport
 *
 * IMPORTANT: while any unit can carry cargo, only player units will emulate mass (dcs limitation)
 * @param unit the unit to carry the cargo
 * @param cargo the cargo to be loaded
 */
export async function loadCargo(unit: Unit, cargo: Cargo): Promise<void> {
  const em = await emFork()

  unit.cargos.add(cargo)

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
  const em = await emFork()

  await unit.cargos.loadItems()

  // mark the cargo as removed from the unit
  unit.cargos.remove(cargo)
  // destroy the cargo itself
  em.remove(cargo)

  // flush the changes
  em.persistAndFlush([unit, cargo])

  // set unit weight in dcs
  await setUnitInternalCargoMass(unit, 0)
}

export async function destroyCargo(cargo: Cargo): Promise<void> {
  const em = await emFork()
  em.remove(cargo)
  await em.flush()
}

export function isBaseCargo(cargo: Cargo): cargo is BaseCargo {
  return cargo.superType === CargoSuperType.Base
}

export function isUnitCargo(cargo: Cargo): cargo is UnitCargo {
  return cargo.superType === CargoSuperType.Unit
}
