/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable('units', (table) => {
    table.boolean('hidden') // a hidden unit can't be deleted, and doesn't show up on f10

    table.index('hidden') // we often do lookups on hidden state
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable('units', table => {
    table.dropColumn('hidden')
  })
}
