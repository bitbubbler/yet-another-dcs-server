import { MikroORM } from '@mikro-orm/core'
import { EntityManager, BetterSqliteDriver } from '@mikro-orm/better-sqlite'
import options from '../mikro-orm.config'

export const orm = MikroORM.init<BetterSqliteDriver>(options).then(
  async orm => {
    // we need to setup the database connection before we allow it to be used
    await orm.em.getConnection().execute('PRAGMA journal_mode = WAL')
    await orm.em.getConnection().execute('PRAGMA foreign_keys = ON')

    // migrations
    await orm.getMigrator().up()

    return orm
  }
)

export function entityManager(
  orm: MikroORM<BetterSqliteDriver>
): EntityManager {
  return orm.em.fork()
}
