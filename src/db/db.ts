import { Knex, knex as knexActual } from 'knex'
import { Coalition } from '../generated/dcs/common/v0/Coalition'
import { SpawnerType } from '../spawner'
import { CargoType, CargoTypeName } from '../cargo'
import { BaseType } from '../base'
import { StaticObjectTypeName } from '../staticObject'
import { UnitTypeName } from '../unit'
import { LineType } from '../generated/dcs/trigger/v0/LineType'
import { MarkupType } from '../markup'

export const knex = knexActual({
  client: 'better-sqlite3',
  connection: {
    filename: '../dev.sqlite',
  },
  migrations: {
    tableName: 'migrations',
  },
  pool: {
    afterCreate: function (connection: any, callback: any) {
      connection.prepare('PRAGMA foreign_keys = ON').run()
      connection.prepare('PRAGMA journal_mode=WAL').run()
      callback(null, connection)
    },
  },
  useNullAsDefault: true,
})

export async function prepare(): Promise<void> {
  await knex.migrate.latest()

  console.log('database migrated')
}

export interface Base {
  baseId: number
  positionId: number
  name: string
  type: BaseType
  coalition: number
  createdAt: Date
  updatedAt: Date
  goneAt?: Date
}

export type BaseInsert = Pick<
  Base,
  'positionId' | 'name' | 'type' | 'coalition' | 'createdAt' | 'updatedAt'
>

export type BaseUpdate = Pick<Cargo, 'updatedAt'> &
  Partial<Omit<Base, 'createdAt'>>

export interface BaseStaticObject {
  baseId: number
  staticObjectId: number
}

export type BaseStaticObjectInsert = Pick<
  BaseStaticObject,
  'baseId' | 'staticObjectId'
>

export type BaseStaticObjectUpdate = Partial<
  Omit<BaseStaticObject, 'createdAt'>
>

export interface BaseUnit {
  baseId: number
  unitId: number
}

export type BaseUnitInsert = Pick<BaseUnit, 'baseId' | 'unitId'>

export type BaseUnitUpdate = Record<string, never>

export interface Cargo {
  cargoId: number
  createdAt: Date
  displayName: string
  goneAt?: Date
  internal: boolean
  mass: number
  originBaseId: number
  positionId: number
  type: CargoType
  typeName: CargoTypeName
  unitTypeName?: UnitTypeName
  updatedAt: Date
  uuid: Buffer
}

type CargoInsert = Pick<
  Cargo,
  | 'createdAt'
  | 'displayName'
  | 'internal'
  | 'mass'
  | 'originBaseId'
  | 'positionId'
  | 'type'
  | 'typeName'
  | 'updatedAt'
  | 'uuid'
> &
  Partial<Pick<Cargo, 'unitTypeName'>>

export type CargoUpdate = Pick<Cargo, 'updatedAt'> &
  Partial<Omit<Cargo, 'createdAt'>>

export interface Color {
  colorId: number
  red: number
  green: number
  blue: number
  alpha: number
}

export type ColorInsert = Pick<Color, 'red' | 'green' | 'blue' | 'alpha'>

export type ColorUpdate = Partial<Color>

export interface Markup {
  markupId: number
  positionId: number
  fillColorId: number
  lineColorId: number
  readonly: boolean
  coalition: Coalition
  type: MarkupType
  lineType?: LineType
  fontSize?: number
  text?: string
  radius?: number
}

export type MarkupInsert = Pick<
  Markup,
  | 'coalition'
  | 'fillColorId'
  | 'lineColorId'
  | 'positionId'
  | 'readonly'
  | 'type'
> &
  Partial<Pick<Markup, 'lineType' | 'fontSize' | 'text' | 'radius'>>

export type MarkupUpdate = Partial<Markup>

export interface Position {
  positionId: number
  lat: number
  lon: number
  alt: number
  /** heading in radians */
  heading: number
  createdAt: Date
  updatedAt: Date
}

export type PositionInsert = Pick<
  Position,
  'lat' | 'lon' | 'alt' | 'heading' | 'createdAt' | 'updatedAt'
>

export type PositionUpdate = Pick<Position, 'updatedAt'> & Partial<Position>

export interface SpawnGroup {
  name: string
  typeNamesJson: string
  createdAt: Date
  updatedAt: Date
}

export type SpawnGroupInsert = Pick<
  SpawnGroup,
  'name' | 'typeNamesJson' | 'createdAt' | 'updatedAt'
>

export type SpawnGroupUpdate = Pick<SpawnGroup, 'updatedAt'> &
  Partial<Omit<SpawnGroup, 'createdAt'>>

export interface Spawner {
  spawnerId: number
  positionId: number
  coalition: Coalition
  type: SpawnerType
  createdAt: Date
  updatedAt: Date
  capturedAt: Date | null
  destroyedAt: Date | null
  goneAt: Date | null
}

export type SpawnerInsert = Pick<
  Spawner,
  'positionId' | 'coalition' | 'type' | 'createdAt' | 'updatedAt'
>

export type SpawnerUpdate = Pick<Spawner, 'updatedAt'> &
  Partial<Omit<Spawner, 'createdAt'>>

export interface SpawnerQueue {
  spawnerId: number
  unitId: number
  createdAt: Date
  doneAt: Date | null
}

export type SpawnerQueueInsert = Pick<
  SpawnerQueue,
  'spawnerId' | 'unitId' | 'createdAt'
>

export type SpawnerQueueUpdate = Partial<Omit<SpawnerQueue, 'createdAt'>>

export interface StaticObject {
  country: number
  createdAt: Date
  goneAt?: Date
  positionId: number
  staticObjectId: number
  typeName: StaticObjectTypeName
  updatedAt: Date
  uuid: Buffer
}

export type StaticObjectInsert = Pick<
  StaticObject,
  'country' | 'createdAt' | 'positionId' | 'typeName' | 'updatedAt' | 'uuid'
>

export type StaticObjectUpdate = Pick<StaticObject, 'updatedAt'> &
  Partial<Omit<StaticObject, 'createdAt'>>

export interface Unit {
  country: number
  createdAt: Date
  destroyedAt: Date | null
  goneAt: Date | null
  hidden: boolean
  isPlayerSlot: number // sqlite stores booles as as an integer acting as a bit (0 or 1)
  name: string
  positionId: number
  typeName: string
  updatedAt: Date
  unitId: number
}

export type UnitInsert = Pick<
  Unit,
  | 'country'
  | 'createdAt'
  | 'hidden'
  | 'isPlayerSlot'
  | 'name'
  | 'positionId'
  | 'typeName'
  | 'updatedAt'
>

export type UnitUpdate = Pick<Unit, 'updatedAt'> &
  Partial<Omit<Unit, 'createdAt'>>

export interface UnitCargo {
  unitId: number
  cargoId: number
}

export type UnitCargoInsert = Pick<UnitCargo, 'unitId' | 'cargoId'>

export type UnitCargoUpdate = Partial<UnitCargo>

// Put table types here
// see https://knexjs.org/guide/#typescript
declare module 'knex/types/tables' {
  interface Tables {
    bases: Knex.CompositeTableType<Base, BaseInsert, BaseUpdate>
    baseStaticObjects: Knex.CompositeTableType<
      BaseStaticObject,
      BaseStaticObjectInsert,
      BaseStaticObjectUpdate
    >
    baseUnits: Knex.CompositeTableType<BaseUnit, BaseUnitInsert, BaseUnitUpdate>
    cargos: Knex.CompositeTableType<Cargo, CargoInsert, CargoUpdate>
    colors: Knex.CompositeTableType<Color, ColorInsert, ColorUpdate>
    markups: Knex.CompositeTableType<Markup, MarkupInsert, MarkupUpdate>
    positions: Knex.CompositeTableType<Position, PositionInsert, PositionUpdate>
    spawnerQueues: Knex.CompositeTableType<
      SpawnerQueue,
      SpawnerQueueInsert,
      SpawnerQueueUpdate
    >
    spawners: Knex.CompositeTableType<Spawner, SpawnerInsert, SpawnerUpdate>
    spawnGroups: Knex.CompositeTableType<
      SpawnGroup,
      SpawnGroupInsert,
      SpawnGroupUpdate
    >
    staticObjects: Knex.CompositeTableType<
      StaticObject,
      StaticObjectInsert,
      StaticObjectUpdate
    >
    unitCargos: Knex.CompositeTableType<
      UnitCargo,
      UnitCargoInsert,
      UnitCargoUpdate
    >
    units: Knex.CompositeTableType<Unit, UnitInsert, UnitUpdate>
  }
}
