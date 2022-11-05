import { PositionLL } from '../common'
import { StaticObjectTypeName } from '../staticObject'

interface TemplateObject<TTypeName> {
  typeName: TTypeName
  bearing: number // bearing from origin point (compass bearing)
  distance: number // distance from origin point in meters
  heading: number
}

export interface Template {
  origin: Pick<PositionLL, 'lat' | 'lon'>
  staticObjects: TemplateObject<StaticObjectTypeName>[]
  units: TemplateObject<string>[]
}
