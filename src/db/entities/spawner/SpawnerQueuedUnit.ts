import { Entity, ManyToOne, OneToOne, Property, Unique } from '@mikro-orm/core'
import { Spawner } from './Spawner'
import { Unit } from '../Unit'

export type NewSpawnerQueuedUnit = Pick<SpawnerQueuedUnit, 'spawner' | 'unit'>

@Entity({ tableName: 'spawnerQueuedUnits' })
@Unique({ properties: ['spawner', 'unit'] })
export class SpawnerQueuedUnit {
  @ManyToOne({ fieldName: 'spawnerId', primary: true })
  spawner: Spawner

  @OneToOne({ fieldName: 'unitId', primary: true })
  unit: Unit

  @Property()
  doneAt?: Date

  constructor(newSpawnerQueuedUnit: NewSpawnerQueuedUnit) {
    const { spawner, unit } = newSpawnerQueuedUnit

    this.spawner = spawner
    this.unit = unit
  }

  done() {
    this.doneAt = new Date()
  }
}
