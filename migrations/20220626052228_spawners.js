/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('spawners', table => {
    table.integer('spawnerId').notNullable()
    table.integer('positionId').notNullable()
    table.integer('coalition').notNullable()
    table.integer('type').notNullable()
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('destroyedAt')
    table.timestamp('capturedAt')
    table.timestamp('goneAt')

    table.primary('spawnerId')
  })

  await knex.schema.createTable('spawnerQueues', table => {
    table.integer('spawnerId').notNullable()
    table.integer('unitId').notNullable()
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('doneAt')

    table.unique(['spawnerId', 'unitId'])

    table.foreign('spawnerId').references('spawners.spawnerId')
    table.foreign('unitId').references('units.unitId')
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTable('spawnerQueues')
  await knex.schema.dropTable('spawners')
}
