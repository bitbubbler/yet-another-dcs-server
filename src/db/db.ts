import { Knex, knex as knexActual } from 'knex'
import { Coalition } from '../../generated/dcs/common/v0/Coalition'
import { SpawnerType } from '../autoRespawn/types'

// eslint-disable-next-line @typescript-eslint/no-var-requires
export const knex = knexActual({
  client: 'better-sqlite3',
  connection: {
    filename: '../dev.sqlite',
  },
  migrations: {
    tableName: 'migrations',
  },
  useNullAsDefault: true,
})

export async function prepare(): Promise<void> {
  await knex.migrate.latest()

  console.log('database migrated')
}

export interface Unit {
  unitId: number
  name: string
  country: number
  typeName: string
  positionId: number
  createdAt: Date
  updatedAt: Date
  destroyedAt?: Date
  goneAt?: Date
}

export type UnitInsert = Pick<
  Unit,
  'positionId' | 'name' | 'country' | 'typeName' | 'createdAt' | 'updatedAt'
>

export type UnitUpdate = Pick<Unit, 'updatedAt'> &
  Partial<Omit<Unit, 'unitId' | 'positionId' | 'createdAt'>>

export interface Position {
  positionId: number
  lat: number
  lon: number
  alt: number
  heading: number
  createdAt: Date
  updatedAt: Date
}

export type PositionInsert = Pick<
  Position,
  'lat' | 'lon' | 'alt' | 'heading' | 'createdAt' | 'updatedAt'
>

export type PositionUpdate = Pick<Position, 'updatedAt'> &
  Partial<Omit<Position, 'positionId' | 'createdAt'>>

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
  destroyedAt: Date
  capturedAt: Date
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
  doneAt: Date
}

export type SpawnerQueueInsert = Pick<
  SpawnerQueue,
  'spawnerId' | 'unitId' | 'createdAt'
>

export type SpawnerQueueUpdate = Partial<Omit<SpawnerQueue, 'createdAt'>>

// Put table types here
// see https://knexjs.org/guide/#typescript
declare module 'knex/types/tables' {
  interface Tables {
    units: Knex.CompositeTableType<Unit, UnitInsert, UnitUpdate>
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
  }
}
