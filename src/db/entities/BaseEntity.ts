import { EntityDTO, Property, wrap } from '@mikro-orm/core'

export abstract class BaseEntity {
  @Property()
  createdAt: Date = new Date()

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date()

  toJSON(): EntityDTO<this> {
    return wrap(this).toObject()
  }
}
