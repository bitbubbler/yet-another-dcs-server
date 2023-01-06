/**
 * ALL logistics definitions should be defined as static definitions,
 * there should not be any imports/dynamic code here
 * This is intended to be an intentionally overly simplified "source of truth"
 * for which types of cargo the system knows about. It's an attempt to force
 * types onto the system so we can build requirements and code completion
 */

import {
  BaseCargoType,
  CargoSuperType,
  CargoTypeName,
  NewCargo,
  UnitCargoType,
  UnitTypeName,
} from '../db'

export interface CargoDefinitionBase
  extends Omit<NewCargo, 'position' | 'originBase'> {
  id: string
}

export interface ExternalCargoDefinition extends CargoDefinitionBase {
  internal: false
}

export interface InternalCargoDefinition extends CargoDefinitionBase {
  internal: true
}

export interface UnitCargoDefinition extends InternalCargoDefinition {
  type: UnitCargoType
  unitTypeName: UnitTypeName
  superType: CargoSuperType.Unit
}

export interface BaseCargoDefinition extends CargoDefinitionBase {
  internal: false | true
  type: BaseCargoType
  superType: CargoSuperType.Base
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
    type: BaseCargoType.BaseCreate,
    typeName: CargoTypeName.UH1HCargo,
    superType: CargoSuperType.Base,
  },
  {
    displayName: 'Base Upgrade Kit (small)', // arg[1]
    id: 'internal-base-upgrade-small',
    mass: 100, // TODO: find a reasonable value here
    internal: true,
    type: BaseCargoType.BaseUpgrade,
    typeName: CargoTypeName.UH1HCargo,
    superType: CargoSuperType.Base,
  },
  {
    displayName: 'Base Upgrade Kit (large)', // arg[2]
    id: 'internal-base-upgrade-large',
    mass: 100, // TODO: find a reasonable value here
    internal: false,
    type: BaseCargoType.BaseUpgrade,
    typeName: CargoTypeName.UH1HCargo,
    superType: CargoSuperType.Base,
  },
  {
    displayName: 'Truck M939 Heavy', // arg[3]
    id: 'internal-unit-create-m939-truck',
    mass: 1000,
    internal: true,
    type: UnitCargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.M939,
    superType: CargoSuperType.Unit,
  },
  {
    displayName: 'EWR AN/FPS-117 Radar', // arg[4]
    id: 'internal-unit-create-fps117-ewr',
    mass: 1000,
    internal: true,
    type: UnitCargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.FPS117,
    superType: CargoSuperType.Unit,
  },
  {
    displayName: 'JTAC HMMWV', // arg[5]
    id: 'internal-unit-create-jtac-hmmwv',
    mass: 1000,
    internal: true,
    type: UnitCargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.HmmwvJtac,
    superType: CargoSuperType.Unit,
  },
  {
    displayName: 'Scout HMMWV', // arg[6]
    id: 'internal-unit-create-scout-hmmwv',
    mass: 1000,
    internal: true,
    type: UnitCargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.HmmwvMg,
    superType: CargoSuperType.Unit,
  },
  {
    displayName: 'ATGM HMMWV', // arg[7]
    id: 'internal-unit-create-atgm-hmmwv',
    mass: 1000,
    internal: true,
    type: UnitCargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.HmmwvTow,
    superType: CargoSuperType.Unit,
  },
  {
    displayName: 'APC TPz Fuchs', // arg[8]
    id: 'internal-unit-create-tpz-fuchs',
    mass: 1000,
    internal: true,
    type: UnitCargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.Fuchs,
    superType: CargoSuperType.Unit,
  },
  {
    displayName: 'IFV LAV-25', // arg[9]
    id: 'internal-unit-create-lav-25',
    mass: 1000,
    internal: true,
    type: UnitCargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.LAV25,
    superType: CargoSuperType.Unit,
  },
  {
    displayName: 'SPG Stryker MGS', // arg[10]
    id: 'internal-unit-create-stryker-mgs',
    mass: 1000,
    internal: true,
    type: UnitCargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.StrykerMgs,
    superType: CargoSuperType.Unit,
  },
  {
    displayName: 'ATGM Stryker', // arg[11]
    id: 'internal-unit-create-atgm-stryker',
    mass: 1000,
    internal: true,
    type: UnitCargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.StrykerAtgm,
    superType: CargoSuperType.Unit,
  },
  {
    displayName: 'ATGM VAB Mephisto', // arg[12]
    id: 'internal-unit-create-atgm-mephisto',
    mass: 1000,
    internal: true,
    type: UnitCargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.MephistoAtgm,
    superType: CargoSuperType.Unit,
  },
  {
    displayName: 'IFV Marder', // arg[13]
    id: 'internal-unit-create-1a3-marder',
    mass: 1000,
    internal: true,
    type: UnitCargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.Marder,
    superType: CargoSuperType.Unit,
  },
  {
    displayName: 'IFV Warrior', // arg[14]
    id: 'internal-unit-create-mcv80-warrior',
    mass: 1000,
    internal: true,
    type: UnitCargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.MCV80,
    superType: CargoSuperType.Unit,
  },
  {
    displayName: 'IFV M2A2 Bradley', // arg[15]
    id: 'internal-unit-create-m2a2-bradley',
    mass: 1000,
    internal: true,
    type: UnitCargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.M2A2,
    superType: CargoSuperType.Unit,
  },
  {
    displayName: 'MBT M1A2 Abrams', // arg[16]
    id: 'internal-unit-create-m1a2-abrams',
    mass: 1000,
    internal: true,
    type: UnitCargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.M1A2,
    superType: CargoSuperType.Unit,
  },
  {
    displayName: 'MBT Challenger II', // arg[17]
    id: 'internal-unit-create-challenger-2',
    mass: 1000,
    internal: true,
    type: UnitCargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.Challenger2,
    superType: CargoSuperType.Unit,
  },
  {
    displayName: 'MBT Leopard-2A6M', // arg[18]
    id: 'internal-unit-create-leopard-2a6m',
    mass: 1000,
    internal: true,
    type: UnitCargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.Leopard2,
    superType: CargoSuperType.Unit,
  },
  {
    displayName: 'MBT Leclerc', // arg[19]
    id: 'internal-unit-create-leclerc',
    mass: 1000,
    internal: true,
    type: UnitCargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.Leclerc,
    superType: CargoSuperType.Unit,
  },
  {
    displayName: 'SPH Dana vz77 152mm', // arg[20]
    id: 'internal-unit-create-sph-dana',
    mass: 1000,
    internal: true,
    type: UnitCargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.Dana,
    superType: CargoSuperType.Unit,
  },
  {
    displayName: 'SPH M109 Paladin 155mm', // arg[21]
    id: 'internal-unit-create-sph-paladin',
    mass: 1000,
    internal: true,
    type: UnitCargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.M109,
    superType: CargoSuperType.Unit,
  },
  {
    displayName: 'SPH T155 Firtina 155mm', // arg[22]
    id: 'internal-unit-create-sph-firtina',
    mass: 1000,
    internal: true,
    type: UnitCargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.Firtina,
    superType: CargoSuperType.Unit,
  },
  {
    displayName: 'MLRS M270 227mm', // arg[23]
    id: 'internal-unit-create-mlrs-m270',
    mass: 1000,
    internal: true,
    type: UnitCargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.MlrsM270,
    superType: CargoSuperType.Unit,
  },
  {
    displayName: 'MLRS 9A52 Smerch HE 300mm', // arg[24]
    id: 'internal-unit-create-mlrs-9a52',
    mass: 1000,
    internal: true,
    type: UnitCargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.Mlrs9A52,
    superType: CargoSuperType.Unit,
  },
  {
    displayName: 'SPAAA Vulcan M163', // arg[25]
    id: 'internal-unit-create-m163-vulcan',
    mass: 1000,
    internal: true,
    type: UnitCargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.Vulcan,
    superType: CargoSuperType.Unit,
  },
  {
    displayName: 'SPAAA Gepard', // arg[26]
    id: 'internal-unit-create-gepard',
    mass: 1000,
    internal: true,
    type: UnitCargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.Gepard,
    superType: CargoSuperType.Unit,
  },
  {
    displayName: 'SAM Avenger (Stinger)', // arg[27]
    id: 'internal-unit-create-avenger-stinger',
    mass: 1000,
    internal: true,
    type: UnitCargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.Avenger,
    superType: CargoSuperType.Unit,
  },
  {
    displayName: 'SAM Chaparral M48', // arg[28]
    id: 'internal-unit-create-m48-chaparral',
    mass: 1000,
    internal: true,
    type: UnitCargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.Chaparral,
    superType: CargoSuperType.Unit,
  },
  {
    displayName: 'SAM Roland ADS', // arg[29]
    id: 'internal-unit-create-roland-ads',
    mass: 1000,
    internal: true,
    type: UnitCargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.RolandAds,
    superType: CargoSuperType.Unit,
  },
  {
    displayName: 'SAM Linebacker - Bradley M6S', // arg[30]
    id: 'internal-unit-create-m65-linebacker',
    mass: 1000,
    internal: true,
    type: UnitCargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.Linebacker,
    superType: CargoSuperType.Unit,
  },
  {
    displayName: 'SAM Hawk SR (AN/MPQ50)', // arg[31]
    id: 'internal-unit-create-hawk-sr',
    mass: 1000,
    internal: true,
    type: UnitCargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.HawkSr,
    superType: CargoSuperType.Unit,
  },
  {
    displayName: 'SAM Hawk TR (AN/MPQ46)', // arg[32]
    id: 'internal-unit-create-hawk-tr',
    mass: 1000,
    internal: true,
    type: UnitCargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.HawkTr,
    superType: CargoSuperType.Unit,
  },
  {
    displayName: 'SAM Hawk Platoon Command Post (PCP)', // arg[33]
    id: 'internal-unit-create-hawk-pcp',
    mass: 1000,
    internal: true,
    type: UnitCargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.HawkPcp,
    superType: CargoSuperType.Unit,
  },
  {
    displayName: 'SAM Hawk CWAR (AN/MPQ55)', // arg[34]
    id: 'internal-unit-create-hawk-cwar',
    mass: 1000,
    internal: true,
    type: UnitCargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.HawkCwar,
    superType: CargoSuperType.Unit,
  },
  {
    displayName: 'SAM Hawk LN M192', // arg[35]
    id: 'internal-unit-create-hawk-ln',
    mass: 1000,
    internal: true,
    type: UnitCargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.HawkLn,
    superType: CargoSuperType.Unit,
  },
  {
    displayName: 'SAM NASAMS LN AIM-120B', // arg[36]
    id: 'internal-unit-create-nasam-120b',
    mass: 1000,
    internal: true,
    type: UnitCargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.NasamLnB,
    superType: CargoSuperType.Unit,
  },
  {
    displayName: 'SAM NASAMS LN AIM-120C', // arg[37]
    id: 'internal-unit-create-nasam-120c',
    mass: 1000,
    internal: true,
    type: UnitCargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.NasamLnC,
    superType: CargoSuperType.Unit,
  },
  {
    displayName: 'SAM NASAMS SR MPQ64F1', // arg[38]
    id: 'internal-unit-create-nasam-sr',
    mass: 1000,
    internal: true,
    type: UnitCargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.NasamSr,
    superType: CargoSuperType.Unit,
  },
  {
    displayName: 'SAM NASAMS C2', // arg[39]
    id: 'internal-unit-create-nasam-c2',
    mass: 1000,
    internal: true,
    type: UnitCargoType.UnitCreate,
    typeName: CargoTypeName.UH1HCargo,
    unitTypeName: UnitTypeName.NasamC2,
    superType: CargoSuperType.Unit,
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
