import { Entity, Property } from '@mikro-orm/core'
import { LineType } from '../../../__generated__/dcs/trigger/v0/LineType'

import { MarkupBase, NewMarkupBase } from './MarkupBase'
import { MarkupType } from './types'

export type NewCircleMarkup = Pick<CircleMarkup, 'lineType' | 'radius'> &
  NewMarkupBase

@Entity({ discriminatorValue: MarkupType.Circle })
export class CircleMarkup extends MarkupBase {
  @Property()
  lineType: LineType

  @Property()
  radius: number

  type: MarkupType.Circle = MarkupType.Circle

  constructor(newCircleMarkup: NewCircleMarkup) {
    super(newCircleMarkup)

    const { lineType, radius } = newCircleMarkup

    this.lineType = lineType
    this.radius = radius
  }
}
