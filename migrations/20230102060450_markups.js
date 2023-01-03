/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('colors', table => {
    table.increments('colorId').notNullable()
    table.float('red').notNullable()
    table.float('green').notNullable()
    table.float('blue').notNullable()
    table.float('alpha').notNullable()
  })

  await knex.schema.createTable('markupPoints', table => {
    table.integer('markupId').notNullable().references('markups.markupId')
    table.integer('positionId').notNullable().references('positions.positionId')
    table.integer('index').notNullable()
  })

  await knex.schema.createTable('markups', table => {
    table.increments('markupId').notNullable()
    table.integer('fillColorId').notNullable().references('colors.colorId')
    table.integer('lineColorId').notNullable().references('colors.colorId')
    table.integer('positionId').notNullable().references('positions.positionId')
    table.boolean('readonly').notNullable()
    table.integer('coalition').notNullable()
    table.integer('type').notNullable()
    // specific to shape markup
    table.integer('lineType').nullable()
    // specific to text markup
    table.integer('fontSize').nullable()
    table.string('text').nullable()
    // specific to circle merkup
    table.integer('radius').nullable()
  })

  await knex.schema.alterTable('bases', table => {
    table.integer('labelMarkupId').notNullable().defaultTo(-1).references('markups.markupId')
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTable('colors')
  await knex.schema.dropTable('markupPoints')
  await knex.schema.dropTable('markups')
}
