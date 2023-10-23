import {
  Collection,
  Entity,
  Filter,
  Index,
  ManyToMany,
  OneToOne,
  PrimaryKey,
  Property,
  Ref,
  Unique,
} from '@mikro-orm/core'
import { Position } from '../Position'
import { BaseEntity } from '../BaseEntity'
import { UnitUnitCargo } from './UnitUnitCargo'
import { BaseCargo, CargoBase, CsarCargo, UnitCargo } from '../Cargo'
import { UnitTypeName } from './types'
import { coalitionFrom } from '../../../coalition'

/**
 * An array of unit types that can never respawn
 * */
const UNITS_THAT_CAN_NEVER_RESPAWN: UnitTypeName[] = [
  // all infantry
  UnitTypeName.InfantryAk,
  UnitTypeName.InfantryAkRusVer1,
  UnitTypeName.InfantryAkRusVer2,
  UnitTypeName.InfantryAkRusVer3,
  UnitTypeName.InfantryM1Garand,
  UnitTypeName.InantryM249,
  UnitTypeName.InfantryM4,
  UnitTypeName.InfantryM4Georgia,
  UnitTypeName.InfantryMauser98,
  UnitTypeName.InfantryRpg,
  UnitTypeName.InfantrySMLENo4Mk1,
  UnitTypeName.InsurgentAk,
  UnitTypeName.JTAC,
  UnitTypeName.ParatrooperAKS,
  UnitTypeName.ParatroperRPG,
]

export type NewUnit = Pick<
  Unit,
  'country' | 'hidden' | 'isPlayerSlot' | 'name' | 'position' | 'typeName'
> &
  Partial<Pick<Unit, 'canRespawn'>>

@Entity({ tableName: 'units' })
@Filter({
  name: 'notGone',
  cond: {
    goneAt: {
      $eq: null,
    },
  },
  default: true,
})
export class Unit extends BaseEntity {
  @PrimaryKey()
  unitId!: number

  @Unique()
  @Property()
  name: string

  /**
   * Whether this unit can be considered for respawning by spawners
   */
  @Property()
  canRespawn: boolean

  @ManyToMany({
    entity: () => CargoBase, // NOTE: entity is REQUIRED on this relation due to complexity
    pivotEntity: () => UnitUnitCargo,
  })
  cargos = new Collection<BaseCargo | CsarCargo | UnitCargo>(this)

  @Property()
  country: number

  @Property()
  typeName: UnitTypeName

  @Property()
  isPlayerSlot: boolean

  @OneToOne({
    fieldName: 'positionId',
    unique: true,
    eager: true,
  })
  position: Position

  @Property()
  destroyedAt?: Date

  @Property()
  goneAt?: Date

  @Index()
  @Property()
  hidden: boolean

  constructor(newUnit: NewUnit) {
    super()

    const { country, hidden, isPlayerSlot, name, position, typeName } = newUnit

    this.canRespawn = UNITS_THAT_CAN_NEVER_RESPAWN.includes(typeName)
      ? false
      : newUnit.canRespawn || true
    this.country = country
    this.hidden = hidden
    this.isPlayerSlot = isPlayerSlot
    this.name = name
    this.position = position
    this.typeName = typeName
  }

  get coalition() {
    return coalitionFrom(this.country)
  }

  destroyed() {
    const now = new Date()

    this.destroyedAt = now
    this.goneAt = now
  }

  gone() {
    this.goneAt = new Date()
  }
}
