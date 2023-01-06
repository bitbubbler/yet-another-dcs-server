import {
  Collection,
  Entity,
  Filter,
  OneToOne,
  ManyToMany,
  PrimaryKey,
  Property,
} from '@mikro-orm/core'
import { Coalition } from '../../generated/dcs/common/v0/Coalition'
import { BaseStaticObject } from './BaseStaticObject'
import { BaseEntity } from './BaseEntity'
import { Position } from './Position'
import { StaticObject } from './StaticObject'
import { Unit } from './Unit'
import { BaseUnit } from './BaseUnit'
import { TextMarkup } from './TextMarkup'

export type NewBase = Pick<
  Base,
  'coalition' | 'labelMarkup' | 'name' | 'position' | 'type'
>

@Entity({ tableName: 'bases' })
@Filter({
  name: 'notGone',
  cond: {
    goneAt: {
      $eq: null,
    },
  },
  default: true,
})
export class Base extends BaseEntity {
  @PrimaryKey()
  baseId!: number

  @Property()
  coalition: Coalition

  @Property()
  goneAt?: Date

  @OneToOne({ fieldName: 'labelMarkupId' })
  labelMarkup: TextMarkup

  @Property()
  name: string

  @OneToOne({
    fieldName: 'positionId',
    unique: true,
    eager: true,
  })
  position: Position

  @ManyToMany({
    pivotEntity: () => BaseStaticObject,
  })
  staticObjects = new Collection<StaticObject>(this)

  @Property({ type: 'integer' })
  type: BaseType

  @ManyToMany({
    pivotEntity: () => BaseUnit,
  })
  units = new Collection<Unit>(this)

  constructor(newBase: NewBase) {
    super()

    const { coalition, labelMarkup, name, position, type } = newBase

    this.coalition = coalition
    this.labelMarkup = labelMarkup
    this.name = name
    this.position = position
    this.type = type
  }

  gone() {
    this.goneAt = new Date()
  }
}

export enum BaseType {
  /**
   * Under Construction (new base being created)
   * - no cargo
   * - no lives
   */
  UnderConstruction,
  /**
   * Main operating base (MOB)
   * - more spawn points
   */
  MOB,
  /**
   * Forward operating base (FOB)
   * - spawn points
   */
  FOB,
  /**
   * Forward arming and refueling point (FARP)
   * NOTE: only for arming and refueling
   * - no spawning here
   */
  FARP,
  /**
   * Combat outpost (COP)
   * - troops only (no cargo pickups here')
   * - no spawning here
   */
  COP,
}
