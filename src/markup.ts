import { NewCircleMarkup, NewTextMarkup } from './db'
import { emFork } from './db/connection'
import { markupTextToAll } from './trigger'
import { CircleMarkup, Markup, MarkupType, TextMarkup } from './db'

export async function createCircleMarkup(
  newMarkup: NewCircleMarkup
): Promise<CircleMarkup> {
  const circleMarkup = new CircleMarkup(newMarkup)

  const em = await emFork()
  await em.persistAndFlush(circleMarkup)

  return circleMarkup
}

export async function createTextMarkup(
  newMarkup: NewTextMarkup
): Promise<TextMarkup> {
  const textMarkup = new TextMarkup(newMarkup)

  const em = await emFork()
  await em.persistAndFlush(textMarkup)

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

export async function despawnMarkup(
  markup: TextMarkup | CircleMarkup
): Promise<void> {
  // TODO: implement this
}

export async function destroyMarkup(markup: Markup): Promise<void> {
  const em = await emFork()
  em.remove(markup)
  await em.flush()
}
