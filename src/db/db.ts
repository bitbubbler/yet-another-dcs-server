import { Knex, knex as knexActual } from 'knex'

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

// Put table types here
// see https://knexjs.org/guide/#typescript
declare module 'knex/types/tables' {
  interface Tables {
    units: Knex.CompositeTableType<Unit, UnitInsert, UnitUpdate>
    positions: Knex.CompositeTableType<Position, PositionInsert, PositionUpdate>
    spawnGroups: Knex.CompositeTableType<
      SpawnGroup,
      SpawnGroupInsert,
      SpawnGroupUpdate
    >
  }
}
