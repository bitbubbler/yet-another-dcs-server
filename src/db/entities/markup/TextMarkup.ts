import { Entity, Property } from '@mikro-orm/core'
import { MarkupBase, NewMarkupBase } from './MarkupBase'
import { MarkupType } from './types'

export type NewTextMarkup = Pick<TextMarkup, 'fontSize' | 'text'> &
  NewMarkupBase

@Entity({ discriminatorValue: MarkupType.Text })
export class TextMarkup extends MarkupBase {
  @Property()
  fontSize: number

  @Property()
  text: string

  type: MarkupType.Text = MarkupType.Text

  constructor(newTextMarkup: NewTextMarkup) {
    super(newTextMarkup)

    const { fontSize, text } = newTextMarkup

    this.fontSize = fontSize
    this.text = text
  }
}
