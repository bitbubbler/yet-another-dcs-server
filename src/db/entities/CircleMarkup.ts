import { Entity, Property } from '@mikro-orm/core'
import { LineType } from '../../generated/dcs/trigger/v0/LineType'

import { MarkupBase, MarkupType, NewMarkupPropertyNames } from './Markup'

export type NewCircleMarkup = Pick<
  CircleMarkup,
  NewMarkupPropertyNames | 'lineType' | 'radius'
>

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
