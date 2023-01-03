import { Color as DBColor, knex } from './db'

export async function insertColor(
  color: Omit<DBColor, 'colorId'>
): Promise<DBColor> {
  const { red, green, blue, alpha } = color

  const insertColorResult = await knex('colors')
    .insert({
      red,
      green,
      blue,
      alpha,
    })
    .returning('colorId')

  const [{ colorId }] = insertColorResult

  return {
    colorId,
    red,
    green,
    blue,
    alpha,
  }
}

export async function deleteColor(
  color: Pick<DBColor, 'colorId'>
): Promise<void> {
  const { colorId } = color

  await knex('colors').where({ colorId }).delete()
}
