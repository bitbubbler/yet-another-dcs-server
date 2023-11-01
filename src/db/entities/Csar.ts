import {
  Entity,
  ManyToOne,
  OneToOne,
  PrimaryKey,
  Property,
} from '@mikro-orm/core'
import { Coalition } from '../../__generated__/dcs/common/v0/Coalition'
import { GamePositionLL } from '../../types'
import { BaseEntity } from './BaseEntity'
import { Player } from './Player'
import { StaticObject } from './StaticObject'
import { Unit } from './Unit'

export type NewCsar = Pick<
  Csar,
  'coalition' | 'diedUnit' | 'marker' | 'player' | 'position' | 'unit'
>

@Entity({ tableName: 'csars' })
export class Csar extends BaseEntity {
  @PrimaryKey()
  csarId!: number

  @Property()
  coalition: Coalition

  @Property()
  goneAt?: Date

  @Property()
  pickedUpAt?: Date

  @ManyToOne({
    fieldName: 'playerId',
    eager: true,
  })
  player: Player

  @Property({
    type: 'json',
    nullable: false,
  })
  position: GamePositionLL

  @Property()
  rescuedAt?: Date

  /**
   * The unit that died to generate this csar
   */
  @OneToOne({
    fieldName: 'diedUnitId',
    eager: true,
    unique: false,
  })
  diedUnit: Unit

  @OneToOne({
    fieldName: 'markerStaticObjectId',
    eager: true,
  })
  marker?: StaticObject

  /**
   * The unit to represent this csar in game (the solidier unit)
   */
  @OneToOne({
    fieldName: 'unitId',
    eager: true,
  })
  unit?: Unit

  constructor(newCsar: NewCsar) {
    super()

    const { diedUnit, coalition, marker, player, position, unit } = newCsar

    this.coalition = coalition
    this.diedUnit = diedUnit
    this.player = player
    this.position = position

    if (marker) {
      this.marker = marker
    }

    if (unit) {
      this.unit = unit
    }
  }

  gone() {
    this.goneAt = new Date()
  }

  pickedUp() {
    this.pickedUpAt = new Date()
  }

  rescued() {
    const now = new Date()

    this.rescuedAt = now
    this.goneAt = now
  }
}
