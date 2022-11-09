/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  /**
   * bases can rearm, refuel, or repair (mob, fob, farp)
   * some bases also have slots to spawn at
   */
  await knex.schema.createTable('bases', table => {
    table.integer('baseId').notNullable()
    table.string('name')
    table.integer('positionId').notNullable()
    table.integer('type').notNullable()
    table.integer('coalition').notNullable()
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
    table.timestamp('goneAt') // when the base no longer exists

    table.primary('baseId')
    table.unique('name') // base names must be unique
    table.unique('positionId') // one base per position


    table.foreign('positionId').references('positions.positionId')
  })

  /**
   * cargos track the state of cargo items
   */
  await knex.schema.createTable('cargos', table => {
    table.integer('cargoId').notNullable()
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.string('displayName').notNullable()
    table.timestamp('goneAt') // when the cargos no longer exists (unpacked, destroyed, despawned, etc.)
    table.boolean('internal').notNullable() // is this an internal cargo
    table.integer('mass').notNullable()
    table.integer('positionId').notNullable()
    table.integer('type').notNullable()
    table.string('typeName').notNullable()
    table.string('unitTypeName').nullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
    table.uuid('uuid', { useBinaryUuid: true }) // NOTE: uuid is stored as binary to save space

    table.primary('cargoId')
    table.unique('positionId') // one cargo per position

    table.foreign('positionId').references('positions.positionId')
  })

  /**
   * staticObjects represent static objects we've created (for persistence)
   */
  await knex.schema.createTable('staticObjects', table => {
    table.integer('staticObjectId').notNullable()
    table.timestamp('createdAt').defaultTo(knex.fn.now()).notNullable()
    table.integer('positionId').notNullable()
    table.integer('country').notNullable()
    table.string('typeName').notNullable()
    table.timestamp('updatedAt').defaultTo(knex.fn.now()).notNullable()
    table.uuid('uuid', { useBinaryUuid: true }) // NOTE: uuid is stored as binary to save space

    table.primary('staticObjectId')
    table.unique('positionId') // one static object per position

    table.foreign('positionId').references('positions.positionId')
  })

  /**
   * baseStaticObjects assign a static object to a base (utilities and scenery)
   */
  await knex.schema.createTable('baseStaticObjects', table => {
    table.integer('baseId').notNullable()
    table.integer('staticObjectId').notNullable()

    table.unique(['baseId', 'staticObjectId'])

    table.foreign('baseId').references('bases.baseId')
    table.foreign('staticObjectId').references('staticObjects.staticObjectId')
  })

  /**
   * baseUnits assign a unit to a base (utilities and defenses)
   */
  await knex.schema.createTable('baseUnits', table => {
    table.integer('baseId').notNullable()
    table.integer('unitId').notNullable()

    table.unique(['baseId', 'unitId'])

    table.foreign('baseId').references('bases.baseId')
    table.foreign('unitId').references('units.unitId')
  })

  /**
   * unitCargos assign a cargo to a unit (internal cargo)
   */
  await knex.schema.createTable('unitCargos', table => {
    table.integer('cargoId').notNullable()
    table.integer('unitId').notNullable()

    table.unique(['cargoId', 'unitId'])

    table.foreign('cargoId').references('cargos.cargoId')
    table.foreign('unitId').references('units.unitId')
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTable('bases')
  await knex.schema.dropTable('baseStaticObjects')
  await knex.schema.dropTable('baseUnits')
  await knex.schema.dropTable('cargos')
  await knex.schema.dropTable('staticObjects')
  await knex.schema.dropTable('unitCargos')
}
