import { Markup, CircleMarkup, TextMarkup, MarkupType } from '../markup'
import {
  Color as DBColor,
  knex,
  Markup as DBMarkup,
  Position as DBPosition,
} from './db'
import { insertColor } from './colors'
import { insertPosition } from './positions'

export async function insertMarkup(
  newMarkup: Omit<TextMarkup, 'markupId'> | Omit<CircleMarkup, 'markupId'>
): Promise<Markup> {
  const { coalition, readonly, type } = newMarkup

  const position = await insertPosition({ ...newMarkup.position, heading: 0 })
  const fillColor = await insertColor(newMarkup.fillColor)
  const lineColor = await insertColor(newMarkup.lineColor)

  const { positionId } = position
  const { colorId: fillColorId } = fillColor
  const { colorId: lineColorId } = lineColor

  if (MarkupType.Text === type) {
    const { fontSize, text } = newMarkup

    const insertMarkupResult = await knex('markups')
      .insert({
        coalition,
        fillColorId,
        fontSize,
        lineColorId,
        positionId,
        readonly,
        text,
        type,
      })
      .returning('*')

    const [markup] = insertMarkupResult

    return markupFrom({ markup, position, fillColor, lineColor })
  }

  throw new Error('attempt to insert unsupported markup type')
}

export async function deleteMarkup(markup: Markup): Promise<void> {
  const { markupId } = markup

  await knex('markups').where({ markupId }).delete()
}

export function markupFrom(row: {
  markup: DBMarkup
  position: Omit<DBPosition, 'createdAt' | 'updatedAt'>
  fillColor: DBColor
  lineColor: DBColor
}): Markup {
  const { fillColor, lineColor, markup, position } = row
  const { type } = markup

  if (MarkupType.Text === type) {
    const { coalition, fontSize, markupId, readonly, text } = markup

    if (typeof fontSize === 'undefined') {
      throw new Error(
        `Unexpected error while converting DBMarkup to TextMarkup: missing fontSize for record ${markupId}`
      )
    }

    if (typeof text === 'undefined') {
      throw new Error(
        `Unexpected error while converting DBMarkup to TextMarkup: missing text for record ${markupId}`
      )
    }

    return {
      coalition,
      fillColor,
      fontSize,
      lineColor,
      markupId,
      position,
      readonly,
      text,
      type,
    }
  }

  throw new Error('attempt to read unsupported markup type')
}
