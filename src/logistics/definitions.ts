/**
 * ALL logistics definitions should be defined as static definitions,
 * there should not be any imports/dynamic code here
 * This is intended to be an intentionally overly simplified "source of truth"
 * for which types of cargo the system knows about. It's an attempt to force
 * types onto the system so we can build requirements and code completion
 */

import { CargoType, CargoTypeName, NewCargo } from '../cargo'

export interface CargoDefinitionBase extends Omit<NewCargo, 'position'> {
  id: string
}

export interface ExternalCargoDefinition extends CargoDefinitionBase {
  internal: false
}

export interface InternalCargoDefinition extends CargoDefinitionBase {
  internal: true
}

export type CargoDefinition = ExternalCargoDefinition | InternalCargoDefinition

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
 * We use the unique id from these cargo definitions in the database, so changing or removing them is not advised.
 *
 * The mass defined here is used at cargo creation time only, changing mass here will not change mass of
 * cargos that already exists in the db. This is intentional.
 *
 * NOTE: The order of items here is not important, but that the order does not change is important..
 * IMPORTANT: be careful not to change the order of items (append only)
 * IMPORTANT: be careful not to change the id of an existing item, these are referneced by the db
 * IMPORTANT: be careful when removing definitions, these are referenced by the db
 */
export const allCargoDefinitions = createCargoDefinitionsArray(
  {
    displayName: 'Base Creation Kit',
    id: 'internal-base-create',
    mass: 2000, // TODO: find a reasonable value here
    internal: true,
    type: CargoType.BaseCreate,
    typeName: CargoTypeName.UH1HCargo,
  },
  {
    displayName: 'Base Upgrade Kit (small)',
    id: 'internal-base-upgrade-small',
    mass: 100, // TODO: find a reasonable value here
    internal: true,
    type: CargoType.BaseUpgrade,
    typeName: CargoTypeName.UH1HCargo,
  },
  {
    displayName: 'Base Upgrade Kit (large)',
    id: 'internal-base-upgrade-large',
    mass: 100, // TODO: find a reasonable value here
    internal: false,
    type: CargoType.BaseUpgrade,
    typeName: CargoTypeName.UH1HCargo,
  }
)

export const allBasesCargoDefinitions = [
  allCargoDefinitions[0],
  allCargoDefinitions[1],
  allCargoDefinitions[2],
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
