import {
  Collection,
  Entity,
  Filter,
  ManyToMany,
  OneToOne,
  PrimaryKey,
  Property,
} from '@mikro-orm/core'
import { Coalition } from '../../../__generated__/dcs/common/v0/Coalition'
import { GamePositionLL } from '../../../types'
import { BaseEntity } from '../BaseEntity'
import { StaticObject } from '../StaticObject'
import { Unit } from '../Unit'
import { TextMarkup } from '../markup/TextMarkup'
import { BaseStaticObject } from './BaseStaticObject'
import { BaseUnit } from './BaseUnit'

export type NewBase = Pick<
  Base,
  'coalition' | 'heading' | 'labelMarkup' | 'name' | 'position' | 'type'
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

  @Property()
  heading: number

  @OneToOne({ fieldName: 'labelMarkupId' })
  labelMarkup: TextMarkup

  @Property()
  name: string

  @Property({
    type: 'json',
    nullable: false,
  })
  position: GamePositionLL

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

    const { coalition, heading, labelMarkup, name, position, type } = newBase

    this.coalition = coalition
    this.heading = heading
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
   * - troops only (no cargo pickups here)
   * - no spawning here
   */
  COP,
}
