import { Entity, OneToOne, PrimaryKey, Property } from '@mikro-orm/core'
import { v4 } from 'uuid'
import { UnitTypeName } from './Unit'
import { Base } from './Base'
import { BaseEntity } from './BaseEntity'
import { Position } from './Position'

export enum CargoSuperType {
  Base,
  Unit,
}

export enum BaseCargoType {
  /** For creating bases */
  BaseCreate,
  /** For upgrading bases */
  BaseUpgrade,
}

export enum UnitCargoType {
  /** For creating units */
  UnitCreate,
}

/**
 * IMPORTANT: The values this enum must be the EXACT typeName used by DCS internally for this cargo type
 */
export enum CargoTypeName {
  UH1HCargo = 'uh1h_cargo',
}

type NewCargoProperties =
  | 'displayName'
  | 'internal'
  | 'mass'
  | 'originBase'
  | 'position'
  | 'superType'
  | 'type'
  | 'typeName'

export type NewBaseCargo = Pick<BaseCargo, NewCargoProperties>

export type NewUnitCargo = Pick<UnitCargo, NewCargoProperties | 'unitTypeName'>

export type NewCargo = NewBaseCargo | NewUnitCargo

export type Cargo = BaseCargo | UnitCargo

@Entity({
  abstract: true,
  discriminatorColumn: 'superType',
  tableName: 'cargos',
})
export class CargoBase extends BaseEntity {
  @PrimaryKey()
  cargoId!: number

  @Property()
  displayName: string

  @Property()
  goneAt?: Date

  @Property()
  internal: boolean

  @Property()
  mass: number

  @OneToOne({
    fieldName: 'positionId',
    unique: true,
    eager: true,
  })
  position: Position

  @Property()
  superType: CargoSuperType

  @Property()
  typeName: CargoTypeName

  @Property({ columnType: 'uuid' })
  uuid = v4()

  @OneToOne({ fieldName: 'originBaseId', eager: true })
  originBase: Base

  constructor(newCargo: NewCargo) {
    super()

    const {
      displayName,
      internal,
      mass,
      originBase,
      position,
      superType,
      typeName,
    } = newCargo

    this.displayName = displayName
    this.internal = internal
    this.mass = mass
    this.originBase = originBase
    this.position = position
    this.superType = superType
    this.typeName = typeName
  }
}

@Entity({
  discriminatorValue: CargoSuperType.Base,
})
export class BaseCargo extends CargoBase {
  superType: CargoSuperType.Base = CargoSuperType.Base

  @Property()
  type: BaseCargoType

  constructor(newUnitCargo: NewBaseCargo) {
    super(newUnitCargo)

    const { type } = newUnitCargo

    this.type = type
  }
}

@Entity({
  discriminatorValue: CargoSuperType.Unit,
})
export class UnitCargo extends CargoBase {
  superType: CargoSuperType.Unit = CargoSuperType.Unit

  @Property()
  type: UnitCargoType

  @Property()
  unitTypeName: UnitTypeName

  constructor(newUnitCargo: NewUnitCargo) {
    super(newUnitCargo)

    const { type, unitTypeName } = newUnitCargo

    this.type = type
    this.unitTypeName = unitTypeName
  }
}
