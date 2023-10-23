import { MikroORM } from '@mikro-orm/core'
import { EntityManager, SqliteDriver } from '@mikro-orm/sqlite'
import options from '../mikro-orm.config'

export const orm = MikroORM.init<SqliteDriver>(options)
  .then(async orm => {
    // we need to setup the database connection before we allow it to be used
    await orm.em.getConnection().execute('PRAGMA journal_mode = WAL')
    await orm.em.getConnection().execute('PRAGMA foreign_keys = ON')

    // migrations
    await orm.getMigrator().up()

    return orm
  })
  .catch(error => {
    console.log(`Fatal: db init failed`, error)
    process.exit(1)
  })

export async function emFork(): Promise<EntityManager<SqliteDriver>> {
  return (await orm).em.fork()
}
