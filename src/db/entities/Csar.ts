import {
  Collection,
  Entity,
  Index,
  ManyToMany,
  OneToOne,
  PrimaryKey,
  Property,
  Ref,
  Unique,
} from '@mikro-orm/core'
import { Position } from './Position'
import { BaseEntity } from './BaseEntity'

export type NewCsar = Pick<Csar, 'position'>

@Entity({ tableName: 'csars' })
export class Csar extends BaseEntity {
  @PrimaryKey()
  csarId!: number

  @Property()
  goneAt?: Date

  @Property()
  pickedUpAt?: Date

  @OneToOne({
    fieldName: 'positionId',
    unique: true,
    eager: true,
  })
  position: Position

  constructor(newCsar: NewCsar) {
    super()

    const { position } = newCsar

    this.position = position
  }

  pickedUp() {
    const now = new Date()

    this.pickedUpAt = now
    this.goneAt = now
  }

  gone() {
    this.goneAt = new Date()
  }
}
