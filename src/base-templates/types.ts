import { PositionLL } from '../common'
import { StaticObjectTypeName, UnitTypeName } from '../db'

interface TemplateObject<TTypeName> {
  typeName: TTypeName
  bearing: number // bearing from origin point (compass bearing)
  distance: number // distance from origin point in meters
  heading: number
}

export interface Template {
  origin: Pick<PositionLL, 'lat' | 'lon'>
  /* slots that players can spawn into */
  slots: TemplateObject<UnitTypeName>[]
  /* Static objects (tents, barriers, decorative vehicles, etc) */
  staticObjects: TemplateObject<StaticObjectTypeName>[]
  /* Static actual units (functional units, for things like rearming and refueling) */
  units: TemplateObject<UnitTypeName>[]
}
