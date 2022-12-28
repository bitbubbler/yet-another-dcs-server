
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  /**
   * bases can rearm, refuel, or repair (mob, fob, farp)
   * some bases also have slots to spawn at
   */
  await knex.schema.alterTable('cargos', (table) => {
    table.integer('originBaseId').notNullable()
    table.index('originBaseId') // we use this in where clause
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable('caros', table => {
    table.dropColumn('originBaseId')
  })
}
