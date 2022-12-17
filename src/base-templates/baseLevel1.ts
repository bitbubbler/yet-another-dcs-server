import { StaticObjectTypeName } from '../staticObject'
import { Template } from './types'

export const baseLevel1: Template = {
  origin: { lat: 41.852053081281, lon: 41.79773876352 },
  staticObjects: [
    {
      typeName: StaticObjectTypeName.FarpTent,
      bearing: 0,
      distance: 0,
      heading: 0,
    },
  ],
  slots: [],
  units: [],
}
