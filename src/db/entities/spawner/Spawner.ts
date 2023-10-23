import {
  Collection,
  Entity,
  Filter,
  OneToMany,
  OneToOne,
  PrimaryKey,
  Property,
  Ref,
} from '@mikro-orm/core'
import { Coalition } from '../../../__generated__/dcs/common/v0/Coalition'
import { BaseEntity } from '../BaseEntity'
import { Position } from '../Position'
import { SpawnerQueuedUnit } from './SpawnerQueuedUnit'

/**
 * IMPORTANT: DO NOT CHANGE THE NUMBER ON EACH OF THESE TYPES. Doing so is a breaking change
 * The number associate with each of these enums is used as a database value.
 * You may append to the end (add new numbers) only
 * Explicitly define the value for each entry so that there is no confusion
 */
export enum SpawnerType {
  Easy = 0,
  Medium = 1,
  Hard = 2,
}

export type NewSpawner = Pick<Spawner, 'coalition' | 'position' | 'type'>

@Entity()
@Filter({
  name: 'notGone',
  cond: {
    goneAt: {
      $eq: null,
    },
  },
  default: true,
})
@Filter({
  name: 'notDestroyed',
  cond: {
    destroyedAt: {
      $eq: null,
    },
  },
  default: true,
})
@Filter({
  name: 'notCaptured',
  cond: {
    capturedAt: {
      $eq: null,
    },
  },
  default: true,
})
export class Spawner extends BaseEntity {
  @PrimaryKey()
  spawnerId!: number

  @OneToOne({
    fieldName: 'positionId',
    unique: true,
    eager: true,
  })
  position: Position

  @Property()
  capturedAt?: Date

  @Property()
  coalition: Coalition

  @Property()
  destroyedAt?: Date

  @Property()
  goneAt?: Date

  @Property()
  type: SpawnerType

  @OneToMany({ mappedBy: 'spawner' })
  queuedUnits = new Collection<Ref<SpawnerQueuedUnit>>(this)

  constructor(newSpawner: NewSpawner) {
    super()

    const { coalition, position, type } = newSpawner

    this.coalition = coalition
    this.position = position
    this.type = type
  }

  destroyed() {
    const now = new Date()

    this.destroyedAt = now
    this.goneAt = now
  }

  gone() {
    this.goneAt = new Date()
  }
}
