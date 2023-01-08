import {
  Entity,
  Filter,
  ManyToOne,
  OneToOne,
  PrimaryKey,
  Property,
} from '@mikro-orm/core'
import { Position } from './Position'
import { BaseEntity } from './BaseEntity'
import { Unit } from './Unit'
import { Player } from './Player'
import { Coalition } from '../../generated/dcs/common/v0/Coalition'
import { StaticObject } from './StaticObject'

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

  @OneToOne({
    fieldName: 'positionId',
    unique: true,
    eager: true,
  })
  position: Position

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
