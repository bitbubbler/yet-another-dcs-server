import { knex } from '../db/db'

jest.mock('../db/db', () => {
  const { knex: knexActual } = jest.requireActual('knex')
  return {
    knex: knexActual({
      client: 'better-sqlite3',
      connection: {
        filename: ':memory:',
      },
      migrations: {
        tableName: 'migrations',
      },
      pool: {
        afterCreate: function (connection: any, callback: any) {
          connection.prepare('PRAGMA foreign_keys = ON').run()
          connection.prepare('PRAGMA journal_mode = WAL').run()
          callback(null, connection)
        },
      },
      useNullAsDefault: true,
    }),
  }
})

jest.mock('../cli', () => ({
  options: {
    address: 'hi',
  },
}))

beforeAll(async () => {
  await knex.migrate.latest()
})

afterAll(async () => {
  await knex.destroy()
})
