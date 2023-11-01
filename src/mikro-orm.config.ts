import {
  EntityCaseNamingStrategy,
  LoadStrategy,
  Options,
} from '@mikro-orm/core'
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
  Csar,
  MarkupBase,
  MarkupPoint,
  PlayerIp,
  Spawner,
  SpawnerQueuedUnit,
  SpawnGroup,
  StaticObject,
  TextMarkup,
  Unit,
  UnitCargo,
  UnitUnitCargo,
  Player,
  CsarCargo,
} from './db'
import { BetterSqliteDriver } from '@mikro-orm/better-sqlite'

const config: Options<BetterSqliteDriver> = {
  dbName: '../dev.sqlite',
  debug: false, // TODO: put this on a config from cli.ts
  entities: [
    Base,
    BaseStaticObject,
    BaseUnit,
    BaseCargo,
    CargoBase,
    CsarCargo,
    CircleMarkup,
    Color,
    Csar,
    MarkupBase,
    MarkupPoint,
    Player,
    PlayerIp,
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
  loadStrategy: LoadStrategy.JOINED,
  metadataProvider: TsMorphMetadataProvider,
  migrations: {
    snapshot: true, // required for auto-diffing generated migrations from entities
    tableName: 'migrations',
  },
  namingStrategy: EntityCaseNamingStrategy,
  type: 'better-sqlite',
}

export default config
