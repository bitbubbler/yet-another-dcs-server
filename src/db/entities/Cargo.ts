import { Entity, Filter, OneToOne, PrimaryKey, Property } from '@mikro-orm/core'
import { v4 } from 'uuid'
import { UnitTypeName } from './Unit'
import { Base } from './base/Base'
import { BaseEntity } from './BaseEntity'
import { Position } from './Position'
import { Csar, NewCsar } from './Csar'

export enum CargoSuperType {
  Base,
  Unit,
  Csar,
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
  | 'position'
  | 'superType'
  | 'typeName'

export type NewBaseCargo = Pick<
  BaseCargo,
  NewCargoProperties | 'originBase' | 'type'
>

export type NewCsarCargo = Pick<CsarCargo, NewCargoProperties | 'csar'>

export type NewUnitCargo = Pick<
  UnitCargo,
  NewCargoProperties | 'type' | 'unitTypeName'
>

export type NewCargo = NewBaseCargo | NewCsarCargo | NewUnitCargo

export type Cargo = BaseCargo | CsarCargo | UnitCargo

@Entity({
  abstract: true,
  discriminatorColumn: 'superType',
  tableName: 'cargos',
})
@Filter({
  name: 'notGone',
  cond: {
    goneAt: {
      $eq: null,
    },
  },
  default: true,
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

  @Property({ type: 'integer' })
  superType: CargoSuperType

  @Property({ type: 'string' })
  typeName: CargoTypeName

  @Property({ columnType: 'uuid' })
  uuid = v4()

  constructor(newCargo: NewCargo) {
    super()

    const { displayName, internal, mass, position, superType, typeName } =
      newCargo

    this.displayName = displayName
    this.internal = internal
    this.mass = mass
    this.position = position
    this.superType = superType
    this.typeName = typeName
  }
}

@Entity({
  discriminatorValue: CargoSuperType.Base,
})
export class BaseCargo extends CargoBase {
  @OneToOne({ fieldName: 'originBaseId', eager: true })
  originBase: Base

  superType: CargoSuperType.Base = CargoSuperType.Base

  @Property({ type: 'integer' })
  type: BaseCargoType

  constructor(newUnitCargo: NewBaseCargo) {
    super(newUnitCargo)

    const { originBase, type } = newUnitCargo

    this.originBase = originBase
    this.type = type
  }
}

@Entity({
  discriminatorValue: CargoSuperType.Unit,
})
export class UnitCargo extends CargoBase {
  superType: CargoSuperType.Unit = CargoSuperType.Unit

  @Property({ type: 'integer' })
  type: UnitCargoType

  @Property({ type: 'string' })
  unitTypeName: UnitTypeName

  constructor(newUnitCargo: NewUnitCargo) {
    super(newUnitCargo)

    const { type, unitTypeName } = newUnitCargo

    this.type = type
    this.unitTypeName = unitTypeName
  }
}

@Entity({
  discriminatorValue: CargoSuperType.Csar,
})
export class CsarCargo extends CargoBase {
  superType: CargoSuperType.Csar = CargoSuperType.Csar

  @OneToOne({
    fieldName: 'csarId',
  })
  csar: Csar

  constructor(newCsarCargo: NewCsarCargo) {
    super(newCsarCargo)

    const { csar } = newCsarCargo

    this.csar = csar
  }
}
