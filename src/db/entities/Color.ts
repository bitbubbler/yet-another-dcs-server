import { Entity, PrimaryKey, Property } from '@mikro-orm/core'

export type NewColor = Pick<Color, 'red' | 'green' | 'blue' | 'alpha'>

@Entity({ tableName: 'colors' })
export class Color {
  @PrimaryKey()
  colorId!: number

  @Property({ columnType: 'float' })
  red: number

  @Property({ columnType: 'float' })
  green: number

  @Property({ columnType: 'float' })
  blue: number

  @Property({ columnType: 'float' })
  alpha: number

  constructor(newColor: NewColor) {
    const { red, green, blue, alpha } = newColor

    this.red = red
    this.green = green
    this.blue = blue
    this.alpha = alpha
  }
}
