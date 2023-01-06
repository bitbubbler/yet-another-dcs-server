import { Entity, ManyToOne, Unique } from '@mikro-orm/core'
import { Base } from './Base'
import { StaticObject } from './StaticObject'

@Entity({ tableName: 'baseStaticObjects' })
@Unique({ properties: ['base', 'staticObject'] })
export class BaseStaticObject {
  @ManyToOne({
    fieldName: 'baseId',
    primary: true,
  })
  base: Base

  @ManyToOne({
    fieldName: 'staticObjectId',
    primary: true,
  })
  staticObject: StaticObject

  constructor(base: Base, staticObject: StaticObject) {
    this.base = base
    this.staticObject = staticObject
  }
}
