import { Entity, ManyToOne, Unique } from '@mikro-orm/core'
import { Base } from './Base'
import { Unit } from '../Unit'

@Entity({ tableName: 'baseUnits' })
@Unique({ properties: ['base', 'unit'] })
export class BaseUnit {
  @ManyToOne({
    fieldName: 'baseId',
    primary: true,
  })
  base: Base

  @ManyToOne({
    fieldName: 'unitId',
    primary: true,
    eager: true,
  })
  unit: Unit

  constructor(base: Base, unit: Unit) {
    this.base = base
    this.unit = unit
  }
}
