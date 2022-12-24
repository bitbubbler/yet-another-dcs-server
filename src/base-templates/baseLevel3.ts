import { StaticObjectTypeName } from '../staticObject'
import { UnitTypeName } from '../unit'
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
  slots: [
    {
      typeName: UnitTypeName.AH64D,
      bearing: 344.4356408061597,
      distance: 51.70098773690975,
      heading: 3.0368728984701,
    },
    {
      typeName: UnitTypeName.AH64D,
      bearing: 25.118008684096583,
      distance: 50.943059147000824,
      heading: 3.5081117965086,
    },
    {
      typeName: UnitTypeName.MI24,
      bearing: 64.61322128416482,
      distance: 55.01227981956325,
      heading: 4.0840704496667,
    },
    {
      typeName: UnitTypeName.MI24,
      bearing: 97.08424629281824,
      distance: 59.057999678554694,
      heading: 4.6774823953448,
    },
    {
      typeName: UnitTypeName.UH1H,
      bearing: 125.21858807930074,
      distance: 60.84167350928644,
      heading: 5.1487212933833,
    },
    {
      typeName: UnitTypeName.UH1H,
      bearing: 146.43356234173967,
      distance: 62.710009332501805,
      heading: 5.3232542185827,
    },
    {
      typeName: UnitTypeName.MI8,
      bearing: 220.76887848191976,
      distance: 62.27404860142305,
      heading: 0.45378560551853,
    },
    {
      typeName: UnitTypeName.MI8,
      bearing: 248.06762275029905,
      distance: 65.00184943348152,
      heading: 0.85521133347722,
    },
  ],
  units: [
    {
      typeName: UnitTypeName.M818,
      bearing: 336.0123373306782,
      distance: 12.81669423315318,
      heading: -2.0943949891026,
    },
    {
      typeName: UnitTypeName.M978,
      bearing: 214.47236292039022,
      distance: 12.943673400904684,
      heading: -1.0471976162875,
    },
  ],
}
