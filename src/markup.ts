import { Coalition } from './generated/dcs/common/v0/Coalition'
import { Color__Output } from './generated/dcs/trigger/v0/Color'
import { LineType } from './generated/dcs/trigger/v0/LineType'
import { PositionLL, Color } from './common'
import { deleteMarkup, insertMarkup } from './db'
import { markupTextToAll } from './trigger'

export enum MarkupType {
  Text,
  Circle,
}

type NewMarkupPropertyNames =
  | 'coalition'
  | 'fillColor'
  | 'lineColor'
  | 'position'
  | 'readonly'
  | 'type'

export type NewTextMarkup = Pick<
  TextMarkup,
  NewMarkupPropertyNames | 'fontSize' | 'text'
>
export type NewCircleMarkup = Pick<
  CircleMarkup,
  NewMarkupPropertyNames | 'lineType' | 'radius'
>

export type NewMarkup = NewTextMarkup | NewCircleMarkup

export interface MarkupBase {
  coalition: Coalition
  fillColor: Color
  lineColor: Color
  markupId: number
  position: PositionLL
  readonly: boolean
}

export interface TextMarkup extends MarkupBase {
  type: MarkupType.Text
  fontSize: number
  text: string
}

export interface CircleMarkup extends MarkupBase {
  type: MarkupType.Circle
  lineType: LineType
  radius: number
}

export type Markup = TextMarkup | CircleMarkup

export async function createMarkup(newMarkup: NewMarkup): Promise<Markup> {
  const markup = await insertMarkup(newMarkup)

  return markup
}

export async function spawnMarkup(markup: Markup): Promise<void> {
  const { type } = markup

  if (MarkupType.Text === type) {
    await markupTextToAll({ ...markup, uniqueId: 20000 + markup.markupId })
  }

  throw new Error('attempted to spawn markup of unknown type')
}

export async function destroyMarkup(markup: Markup): Promise<void> {
  await deleteMarkup(markup)
}
