import { Entity, ManyToOne, Property, Ref } from '@mikro-orm/core'
import { GamePositionLL } from '../../../types'
import { MarkupBase } from './Markup'

export type NewMarkupPoint = Pick<MarkupPoint, 'index' | 'markup' | 'position'>

@Entity({ tableName: 'markupPoints' })
export class MarkupPoint {
  @ManyToOne({ fieldName: 'markupId', primary: true })
  markup: Ref<MarkupBase>

  @Property({
    type: 'json',
    nullable: false,
  })
  position: GamePositionLL

  @Property()
  index: number

  constructor(newMarkupPoint: NewMarkupPoint) {
    const { index, markup, position } = newMarkupPoint

    this.index = index
    this.markup = markup
    this.position = position
  }
}
