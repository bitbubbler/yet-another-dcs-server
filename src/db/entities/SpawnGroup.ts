import { Entity, PrimaryKey, Property, Unique } from '@mikro-orm/core'
import { BaseEntity } from './BaseEntity'

export type NewSpawnGroup = Pick<SpawnGroup, 'name' | 'typeNames'>

@Entity({ tableName: 'spawnGroups' })
export class SpawnGroup extends BaseEntity {
  @PrimaryKey()
  spawnGroupId!: number

  @Unique()
  @Property()
  name: string

  @Property({ type: 'json' })
  typeNames: string[]

  constructor(newSpawnGroup: NewSpawnGroup) {
    super()

    const { name, typeNames } = newSpawnGroup

    this.name = name
    this.typeNames = typeNames
  }
}
