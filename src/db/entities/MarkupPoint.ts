import { Entity, ManyToOne, OneToOne, Property, Ref } from '@mikro-orm/core'
import { MarkupBase } from './Markup'
import { Position } from './Position'

export type NewMarkupPoint = Pick<MarkupPoint, 'index' | 'markup' | 'position'>

@Entity({ tableName: 'markupPoints' })
export class MarkupPoint {
  @ManyToOne({ fieldName: 'markupId', primary: true })
  markup: Ref<MarkupBase>

  @OneToOne({
    fieldName: 'positionId',
    eager: true,
    primary: true,
  })
  position: Position

  @Property()
  index: number

  constructor(newMarkupPoint: NewMarkupPoint) {
    const { index, markup, position } = newMarkupPoint

    this.index = index
    this.markup = markup
    this.position = position
  }
}
