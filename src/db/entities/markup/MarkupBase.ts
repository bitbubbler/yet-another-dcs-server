import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core'
import { GamePositionLL } from '../../../types'
import { BaseEntity } from '../BaseEntity'
import { Color } from '../Color'
import { MarkupType } from './types'

export type NewMarkupBase = Pick<
  MarkupBase,
  'coalition' | 'fillColor' | 'lineColor' | 'position' | 'readonly'
>

@Entity({
  abstract: true,
  discriminatorColumn: 'type',
  tableName: 'markups',
})
export abstract class MarkupBase extends BaseEntity {
  @PrimaryKey()
  markupId!: number

  @ManyToOne({ fieldName: 'fillColorId', eager: true })
  fillColor: Color

  @ManyToOne({ fieldName: 'lineColorId', eager: true })
  lineColor: Color

  @Property({
    type: 'json',
    nullable: false,
  })
  position: GamePositionLL

  @Property({ type: 'integer' })
  abstract type: MarkupType

  @Property()
  readonly: boolean

  @Property()
  coalition: number

  constructor(newMarkup: NewMarkupBase) {
    super()

    const { coalition, fillColor, lineColor, position, readonly } = newMarkup

    this.coalition = coalition
    this.fillColor = fillColor
    this.lineColor = lineColor
    this.position = position
    this.readonly = readonly
  }
}
