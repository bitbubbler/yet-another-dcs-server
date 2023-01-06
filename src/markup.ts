import { entityManager, NewCircleMarkup, NewTextMarkup, orm } from './db'
import { markupTextToAll } from './trigger'
import { CircleMarkup, Markup, MarkupType, TextMarkup } from './db'
import { wrap } from '@mikro-orm/core'

export async function createCircleMarkup(
  newMarkup: NewCircleMarkup
): Promise<CircleMarkup> {
  const circleMarkup = new CircleMarkup(newMarkup)

  await entityManager(await orm)
    .persist(circleMarkup)
    .flush()

  return circleMarkup
}

export async function createTextMarkup(
  newMarkup: NewTextMarkup
): Promise<TextMarkup> {
  const textMarkup = new TextMarkup(newMarkup)

  await entityManager(await orm)
    .persist(textMarkup)
    .flush()

  return textMarkup
}

export async function spawnMarkup(
  markup: TextMarkup | CircleMarkup
): Promise<void> {
  const { type } = markup

  if (MarkupType.Text === type) {
    await markupTextToAll({
      ...markup.toJSON(),
      uniqueId: 20000 + markup.markupId,
    })
    return
  }

  throw new Error('attempted to spawn markup of unknown type')
}

export async function destroyMarkup(markup: Markup): Promise<void> {
  await entityManager(await orm)
    .remove(markup)
    .flush()
}
