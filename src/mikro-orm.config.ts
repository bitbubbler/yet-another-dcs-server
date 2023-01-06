import { EntityCaseNamingStrategy, Options } from '@mikro-orm/core'
import { SqlHighlighter } from '@mikro-orm/sql-highlighter'
import { TsMorphMetadataProvider } from '@mikro-orm/reflection'

import {
  Base,
  BaseStaticObject,
  BaseUnit,
  BaseCargo,
  CargoBase,
  CircleMarkup,
  Color,
  MarkupBase,
  MarkupPoint,
  Position,
  Spawner,
  SpawnerQueuedUnit,
  SpawnGroup,
  StaticObject,
  TextMarkup,
  Unit,
  UnitCargo,
  UnitUnitCargo,
} from './db'
import { BetterSqliteDriver } from '@mikro-orm/better-sqlite'

const config: Options<BetterSqliteDriver> = {
  dbName: ':memory:',
  debug: false, // TODO: put this on a config from cli.ts
  entities: [
    Base,
    BaseStaticObject,
    BaseUnit,
    BaseCargo,
    CargoBase,
    CircleMarkup,
    Color,
    MarkupBase,
    MarkupPoint,
    Position,
    Spawner,
    SpawnerQueuedUnit,
    SpawnGroup,
    StaticObject,
    TextMarkup,
    Unit,
    UnitCargo,
    UnitUnitCargo,
  ],
  forceUtcTimezone: true,
  highlighter: new SqlHighlighter(),
  metadataProvider: TsMorphMetadataProvider,
  migrations: {
    snapshot: true, // required for auto-diffing generated migrations from entities
    tableName: 'migrations',
  },
  namingStrategy: EntityCaseNamingStrategy,
  type: 'better-sqlite',
}

export default config
