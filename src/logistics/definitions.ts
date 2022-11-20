/**
 * ALL logistics definitions should be defined as static definitions,
 * there should not be any imports/dynamic code here
 * This is intended to be an intentionally overly simplified "source of truth"
 * for which types of cargo the system knows about. It's an attempt to force
 * types onto the system so we can build requirements and code completion
 */

import { builtinModules } from 'module'
import { CargoType, CargoTypeName, NewCargo } from '../cargo'
import { UnitTypeName } from '../unit'

export interface CargoDefinitionBase extends Omit<NewCargo, 'position'> {
  id: string
}

export interface ExternalCargoDefinition extends CargoDefinitionBase {
  internal: false
}

export interface InternalCargoDefinition extends CargoDefinitionBase {
  internal: true
}

export interface UnitCargoDefinition extends InternalCargoDefinition {
  type: CargoType.UnitCreate
  unitTypeName: UnitTypeName
}

export interface BaseCargoDefinition extends CargoDefinitionBase {
  internal: false | true
  type: CargoType.BaseCreate | CargoType.BaseUpgrade
}

export type CargoDefinition = BaseCargoDefinition | UnitCargoDefinition

/**
 * Define all cargo here, do not pass variables.
 *
 * You can reference the resulting `allCargoDefinitions` by index
 * to create arrays of specific cargos for use elsewhere
 *
 * This functions allows us to do type inference for the rest of the codebase by extension of keys
 *
 * We current assume that id is unique, and it's used for type inference elsewhere
 * If you add an id that is not unique, you'll have a bad time.
 *
 * We use the unique id from these cargo definitions at runtime.
 *
 * DO NOT reference these these cargo definitions post `create` of a cargo for a unit. The database is the source of truth.
 * The definitions here are references for the runtime to pull from, mostly for creating menus.
 *
 * The mass defined here is used at cargo creation time only, changing mass here will not change mass of
 * cargos that already exists in the db. This is intentional.
 *
 * NOTE: The order of items here is not important, but that the order does not change is important..
 * IMPORTANT: be careful not to change the order of items (append only)
 */
export const allCargoDefinitions = createCargoDefinitionsArray(
  {
    displayName: 'Base Creation Kit', // arg[0]
    id: 'internal-base-create',
    mass: 2000, // TODO: find a reasonable value here
    internal: true,
    type: CargoType.BaseCreate,
    typeName: CargoTypeName.UH1HCargo,
  },
  {
    displayName: 'Base Upgrade Kit (small)', // arg[1]
    id: 'internal-base-upgrade-small',
    mass: 100, // TODO: find a reasonable value here
    internal: true,
    type: CargoType.BaseUpgrade,
    typeName: CargoTypeName.UH1HCargo,
  },
  {
    displayName: 'Base Upgrade Kit (large)', // arg[2]
    id: 'internal-base-upgrade-large',
    mass: 100, // TODO: find a reasonable value here
    internal: false,
    type: CargoType.BaseUpgrade,
    typeName: CargoTypeName.UH1HCargo,
  },
  {
    displayName: 'Truck M939 Heavy', // 2 crates E arg[3]
    id: 'internal-unit-create-m939-truck',
    mass: 1000, 
    internal: true,
    type: CargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.M939,
  },
  {
    displayName: 'EWR AN/FPS-117 Radar', // 3 crates E arg[4]
    id: 'internal-unit-create-fps117-ewr',
    mass: 1000, 
    internal: true,
    type: CargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.FPS117,
  },
  {
    displayName: 'JTAC HMMWV', // 1 crate I/E arg[5]
    id: 'internal-unit-create-jtac-hmmwv',
    mass: 1000, 
    internal: true,
    type: CargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.HmmwvJtac,
  },
  {
    displayName: 'Scout HMMWV', // 1 crate I/E arg[6]
    id: 'internal-unit-create-scout-hmmwv',
    mass: 1000, 
    internal: true,
    type: CargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.HmmwvMg,
  },
  {
    displayName: 'ATGM HMMWV', // 1 crate I/E arg[7]
    id: 'internal-unit-create-atgm-hmmwv',
    mass: 1000, 
    internal: true,
    type: CargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.HmmwvTow,
  },
  {
    displayName: 'APC TPz Fuchs', // 1 crate E arg[8]
    id: 'internal-unit-create-tpz-fuchs',
    mass: 1000, 
    internal: true,
    type: CargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.Fuchs,
  },
  {
    displayName: 'IFV LAV-25', // 1 crate E arg[9]
    id: 'internal-unit-create-lav-25',
    mass: 1000, 
    internal: true,
    type: CargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.LAV25,
  },
  {
    displayName: 'SPG Stryker MGS', // 2 crates E arg[10]
    id: 'internal-unit-create-stryker-mgs',
    mass: 1000, 
    internal: true,
    type: CargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.StrykerMgs,
  },
  {
    displayName: 'ATGM Stryker', // 2 crates E arg[11]
    id: 'internal-unit-create-atgm-stryker',
    mass: 1000, 
    internal: true,
    type: CargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.StrykerAtgm,
  },
  {
    displayName: 'ATGM VAB Mephisto', // 2 crates E arg[12]
    id: 'internal-unit-create-atgm-mephisto',
    mass: 1000, 
    internal: true,
    type: CargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.MephistoAtgm,
  },
  {
    displayName: 'IFV Marder', // 3 crates E arg[13]
    id: 'internal-unit-create-1a3-marder',
    mass: 1000, 
    internal: true,
    type: CargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.Marder,
  },
  {
    displayName: 'IFV Warrior', // 3 crates E arg[14]
    id: 'internal-unit-create-mcv80-warrior',
    mass: 1000, 
    internal: true,
    type: CargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.MCV80,
  },
  {
    displayName: 'IFV M2A2 Bradley', // 3 crates E arg[15]
    id: 'internal-unit-create-m2a2-bradley',
    mass: 1000, 
    internal: true,
    type: CargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.M2A2,
  },
  {
    displayName: 'MBT M1A2 Abrams', // 5 crates E arg[16]
    id: 'internal-unit-create-m1a2-abrams',
    mass: 1000, 
    internal: true,
    type: CargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.M1A2,
  },
  {
    displayName: 'MBT Challenger II', // 5 crates E arg[17]
    id: 'internal-unit-create-challenger-2',
    mass: 1000, 
    internal: true,
    type: CargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.Challenger2,
  },
  {
    displayName: 'MBT Leopard-2A6M', // 5 crates E arg[18]
    id: 'internal-unit-create-leopard-2a6m',
    mass: 1000, 
    internal: true,
    type: CargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.Leopard2,
  },
  {
    displayName: 'MBT Leclerc', // 5 crates E arg[19]
    id: 'internal-unit-create-leclerc',
    mass: 1000, 
    internal: true,
    type: CargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.Leclerc,
  },
  {
    displayName: 'SPH Dana vz77 152mm', // 3 crates E arg[20]
    id: 'internal-unit-create-sph-dana',
    mass: 1000, 
    internal: true,
    type: CargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.Dana,
  },
  {
    displayName: 'SPH M109 Paladin 155mm', // 3 crates E arg[21]
    id: 'internal-unit-create-sph-paladin',
    mass: 1000, 
    internal: true,
    type: CargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.M109,
  },
  {
    displayName: 'SPH T155 Firtina 155mm', // 3 crates E arg[22]
    id: 'internal-unit-create-sph-firtina',
    mass: 1000, 
    internal: true,
    type: CargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.Firtina,
  },
  {
    displayName: 'MLRS M270 227mm', // 5 crates E arg[23]
    id: 'internal-unit-create-mlrs-m270',
    mass: 1000, 
    internal: true,
    type: CargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.MlrsM270,
  },
  {
    displayName: 'MLRS 9A52 Smerch HE 300mm', // 5 crates E arg[24]
    id: 'internal-unit-create-mlrs-9a52',
    mass: 1000, 
    internal: true,
    type: CargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.Mlrs9A52,
  },
  {
    displayName: 'SPAAA Vulcan M163', // 2 crates E arg[25]
    id: 'internal-unit-create-m163-vulcan',
    mass: 1000, 
    internal: true,
    type: CargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.Vulcan,
  },
  {
    displayName: 'SPAAA Gepard', // 2 crates E arg[26]
    id: 'internal-unit-create-gepard',
    mass: 1000, 
    internal: true,
    type: CargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.Gepard,
  },
  {
    displayName: 'SAM Avenger (Stinger)', // 2 crates E arg[27]
    id: 'internal-unit-create-avenger-stinger',
    mass: 1000, 
    internal: true,
    type: CargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.Avenger,
  },
  {
    displayName: 'SAM Chaparral M48', // 2 crates E arg[28]
    id: 'internal-unit-create-m48-chaparral',
    mass: 1000, 
    internal: true,
    type: CargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.Chaparral,
  },
  {
    displayName: 'SAM Roland ADS', // 3 crates E arg[29]
    id: 'internal-unit-create-roland-ads',
    mass: 1000, 
    internal: true,
    type: CargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.RolandAds,
  },
  {
    displayName: 'SAM Linebacker - Bradley M6S', // 3 crates E arg[30]
    id: 'internal-unit-create-m65-linebacker',
    mass: 1000, 
    internal: true,
    type: CargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.Linebacker,
  },
  {
    displayName: 'SAM Hawk SR (AN/MPQ50)', // 1 crate I/E arg[31]
    id: 'internal-unit-create-hawk-sr',
    mass: 1000, 
    internal: true,
    type: CargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.HawkSr,
  },
  {
    displayName: 'SAM Hawk TR (AN/MPQ46)', // 1 crate I/E arg[32]
    id: 'internal-unit-create-hawk-tr',
    mass: 1000, 
    internal: true,
    type: CargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.HawkTr,
  },
  {
    displayName: 'SAM Hawk Platoon Command Post (PCP)', // 1 crate I/E arg[33]
    id: 'internal-unit-create-hawk-pcp',
    mass: 1000, 
    internal: true,
    type: CargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.HawkPcp,
  },
  {
    displayName: 'SAM Hawk CWAR (AN/MPQ55)', // 1 crate I/E arg[34]
    id: 'internal-unit-create-hawk-cwar',
    mass: 1000, 
    internal: true,
    type: CargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.HawkCwar,
  },
  {
    displayName: 'SAM Hawk LN M192', // 1 crate I/E arg[35]
    id: 'internal-unit-create-hawk-ln',
    mass: 1000, 
    internal: true,
    type: CargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.HawkLn,
  },
  {
    displayName: 'SAM NASAMS LN AIM-120B', // 1 crate I/E arg[36]
    id: 'internal-unit-create-nasam-120b',
    mass: 1000, 
    internal: true,
    type: CargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.NasamLnB,
  },
  {
    displayName: 'SAM NASAMS LN AIM-120C', // 1 crate I/E arg[37]
    id: 'internal-unit-create-nasam-120c',
    mass: 1000, 
    internal: true,
    type: CargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.NasamLnC,
  },
  {
    displayName: 'SAM NASAMS SR MPQ64F1', // 1 crate I/E arg[38]
    id: 'internal-unit-create-nasam-sr',
    mass: 1000, 
    internal: true,
    type: CargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.NasamSr,
  },
  {
    displayName: 'SAM NASAMS C2', // 1 crate I/E arg[39]
    id: 'internal-unit-create-nasam-c2',
    mass: 1000, 
    internal: true,
    type: CargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.NasamC2,
  }
)

// Arg per menu, max 10

// Bases
export const allBasesCargoDefinitions = [
  allCargoDefinitions[0],
  allCargoDefinitions[1],
  allCargoDefinitions[2],
]

// F1 - Supplies and Utility
export const allUnitsCargoDefinitions = [ 
  allCargoDefinitions[3],
  allCargoDefinitions[4],
]

// F2 Light
export const lightUnitsCargoDefinitions = [ 
  allCargoDefinitions[5],
  allCargoDefinitions[6],
  allCargoDefinitions[7],
  allCargoDefinitions[8],
  allCargoDefinitions[9],
  allCargoDefinitions[10],
  allCargoDefinitions[11],
  allCargoDefinitions[12],
]

// F3 Heavy
export const heavyUnitsCargoDefinitions = [ 
  allCargoDefinitions[13],
  allCargoDefinitions[14],
  allCargoDefinitions[15],
  allCargoDefinitions[16],
  allCargoDefinitions[17],
  allCargoDefinitions[18],
  allCargoDefinitions[19],
]

// F4 - Artillery
export const artilleryUnitsCargoDefinitions = [ 
  allCargoDefinitions[20],
  allCargoDefinitions[21],
  allCargoDefinitions[22],
  allCargoDefinitions[23],
  allCargoDefinitions[24],
]

// F5 - SHORAD
export const shoradUnitsCargoDefinitions = [ 
  allCargoDefinitions[25],
  allCargoDefinitions[26],
  allCargoDefinitions[27],
  allCargoDefinitions[28],
  allCargoDefinitions[29],
  allCargoDefinitions[30],
]

// F6 - MRAD
export const moradUnitsCargoDefinitions = [ 
  allCargoDefinitions[31],
  allCargoDefinitions[32],
  allCargoDefinitions[33],
  allCargoDefinitions[34],
  allCargoDefinitions[35],
  allCargoDefinitions[36],
  allCargoDefinitions[37],
  allCargoDefinitions[38],
  allCargoDefinitions[39],
]


/**
 * This function exists to allow us to both constrain the value AND infer it's type
 */
function createCargoDefinitionsArray<
  T extends readonly CargoDefinition[] & Array<{ id: V }>,
  V extends string
>(...args: T) {
  return args
}

export type CargoDefinitionID = typeof allCargoDefinitions[number]['id']

export function cargoDefinitionFrom(id: CargoDefinitionID): CargoDefinition {
  const cargoDefinition = allCargoDefinitions.find(
    definition => definition.id === id
  )

  if (!cargoDefinition) {
    throw new Error(
      'Failed to find cargo definition from given id. Something is very wrong..'
    )
  }

  return cargoDefinition
}