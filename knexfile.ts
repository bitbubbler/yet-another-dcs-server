// Update with your config settings.

const config: { [key: string]: import('knex').Knex.Config } = {
  development: {
    client: 'better-sqlite3',
    connection: {
      filename: ':memory:',
    },
    useNullAsDefault: true,
  },
}

module.exports = config
