/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('positions', table => {
    table.integer('positionId').notNullable()
    table.integer('lat').notNullable()
    table.integer('lon').notNullable()
    table.integer('alt').notNullable()
    table.integer('heading').notNullable() // heading in radians
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()

    table.primary(['positionId'])
  })
  await knex.schema.createTable('units', table => {
    table.integer('unitId').notNullable()
    table.string('name').notNullable()
    table.integer('country').notNullable()
    table.string('typeName').notNullable()
    table.boolean('isPlayerSlot').notNullable()
    table.integer('positionId').notNullable()
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('destroyedAt')
    table.timestamp('goneAt')

    table.primary(['unitId'])
    table.unique('name') // unit names must be unique
    table.unique('positionId') // one unit per position

    table.foreign('positionId').references('positions.positionId')
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTable('units')
  await knex.schema.dropTable('positions')
}
