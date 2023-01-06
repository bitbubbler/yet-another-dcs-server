import { Entity, PrimaryKey, Property } from '@mikro-orm/core'
import { BaseEntity } from './BaseEntity'

export type NewPosition = Pick<Position, 'lat' | 'lon' | 'alt' | 'heading'>

@Entity({ tableName: 'positions' })
export class Position extends BaseEntity {
  @PrimaryKey()
  positionId!: number

  @Property()
  lat: number

  @Property()
  lon: number

  @Property()
  alt: number

  @Property()
  heading: number

  constructor(newPosition: NewPosition) {
    super()

    const { lat, lon, alt, heading } = newPosition

    this.lat = lat
    this.lon = lon
    this.alt = alt
    this.heading = heading
  }
}
