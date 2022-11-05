import { StaticObjectTypeName } from '../staticObject'
import { Template } from './types'

export const baseLevel3: Template = {
  origin: { lat: 41.85206027456917, lon: 41.797786380242904 },
  staticObjects: [
    {
      typeName: StaticObjectTypeName.FarpTent,
      bearing: 35.85567410979514,
      distance: 7.438968855028091,
      heading: 2.094395002934,
    },
    {
      typeName: StaticObjectTypeName.FarpTent,
      bearing: 155.5925803834302,
      distance: 7.37216500882318,
      heading: -2.0943949215125,
    },
    {
      typeName: StaticObjectTypeName.FarpTent,
      bearing: 275.27889359394624,
      distance: 7.43522129819449,
      heading: 0,
    },
  ],
  units: [
    {
      typeName: 'M 818',
      bearing: 336.0123373306782,
      distance: 12.81669423315318,
      heading: -2.0943949891026,
    },
    {
      typeName: 'M978 HEMTT Tanker',
      bearing: 214.47236292039022,
      distance: 12.943673400904684,
      heading: -1.0471976162875,
    },
  ],
}
