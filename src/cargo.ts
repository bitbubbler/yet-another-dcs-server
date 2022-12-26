import { v4 as uuidV4 } from 'uuid'
import { Base } from './base'
import { PositionLL } from './common'
import { insertCargo } from './db'
import { deleteUnitCargo, insertUnitCargo } from './db/unitCargos'

import { setUnitInternalCargoMass, Unit, UnitTypeName } from './unit'

export enum CargoType {
  /** For creating bases */
  BaseCreate,
  /** For upgrading bases */
  BaseUpgrade,
  /** For creating units */
  UnitCreate,
}

/**
 * IMPORTANT: The values this enum must be the EXACT typeName used by DCS internally for this cargo type
 */
export enum CargoTypeName {
  UH1HCargo = 'uh1h_cargo',
}

export type NewCargoProperties =
  | 'displayName'
  | 'internal'
  | 'mass'
  | 'originBaseId'
  | 'position'
  | 'type'
  | 'typeName'

export type NewBaseCargo = Pick<BaseCargo, NewCargoProperties>

export type NewUnitCargo = Pick<UnitCargo, NewCargoProperties | 'unitTypeName'>

export type NewCargo = NewBaseCargo | NewUnitCargo

export interface CargoBase {
  displayName: string
  cargoId: number
  internal: boolean
  mass: number
  originBaseId: number
  position: PositionLL
  type: CargoType
  typeName: CargoTypeName
  uuid: string
}

export interface BaseCargo extends CargoBase {
  type: CargoType.BaseCreate | CargoType.BaseUpgrade
  // TODO: add something like this to solve bases being upgraded with their own crate
  // takenFrom: Base['baseId']
}
export interface UnitCargo extends CargoBase {
  type: CargoType.UnitCreate
  unitTypeName: UnitTypeName
}

export type Cargo = BaseCargo | UnitCargo

export async function createCargo(newCargo: NewCargo): Promise<Cargo> {
  const uuid = uuidV4()

  const cargo = await insertCargo({
    uuid,
    ...newCargo,
  })

  return cargo
}

/**
 * Load a cargo onto a unit, for transport
 *
 * IMPORTANT: while any unit can carry cargo, only player units will emulate mass (dcs limitation)
 * @param unit the unit to carry the cargo
 * @param cargo the cargo to be loaded
 */
export async function loadCargo(unit: Unit, cargo: Cargo): Promise<void> {
  // mark cargo in db as loaded for this unit
  await insertUnitCargo(unit, cargo)

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
  // mark cargo in db as loaded for this unit
  await deleteUnitCargo(unit, cargo)

  // set unit weight in dcs
  await setUnitInternalCargoMass(unit, 0)
}

export function isBaseCargo(cargo: Cargo): cargo is BaseCargo {
  return isBaseCargoType(cargo.type)
}

export function isBaseCargoType(
  cargoType: Cargo['type']
): cargoType is BaseCargo['type'] {
  return (
    CargoType.BaseCreate === cargoType || CargoType.BaseUpgrade === cargoType
  )
}

export function isUnitCargo(cargo: Cargo): cargo is UnitCargo {
  return isUnitCargoType(cargo.type)
}

export function isUnitCargoType(
  cargoType: Cargo['type']
): cargoType is UnitCargo['type'] {
  return CargoType.UnitCreate === cargoType
}
