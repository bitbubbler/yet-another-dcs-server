import { Entity, PrimaryKey, Property, Unique } from '@mikro-orm/core'
import { BaseEntity } from './BaseEntity'
import { GameCoalition } from '../../types'

export enum ResourceType {
  Ammo,
  Fuel,
  Metal,
}

export type NewResource = Pick<Resource, 'coalition' | 'type' | 'value'>

@Entity({ tableName: 'resources' })
@Unique({ properties: ['coalition', 'type'] }) // One resoruce type per coalition
export class Resource extends BaseEntity {
  @PrimaryKey()
  resourceId!: number

  /**
   * The coalition the resource belongs to
   */
  @Property()
  coalition: GameCoalition

  @Property({ type: 'integer' })
  type: ResourceType

  /**
   * Resource value (how much of the resource the coalition has)
   */
  @Property()
  value: number

  constructor(newresource: NewResource) {
    super()

    const { coalition, type, value } = newresource

    this.coalition = coalition
    this.type = type
    this.value = value
  }
}
