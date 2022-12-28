import {
  addGroupCommand,
  addGroupCommandSubMenu,
  removeGroupCommandItem,
} from '../mission'
import { groupMenu } from '../menus'
import {
  allBasesCargoDefinitions,
  allUnitsCargoDefinitions,
  lightUnitsCargoDefinitions,
  heavyUnitsCargoDefinitions,
  artilleryUnitsCargoDefinitions,
  shoradUnitsCargoDefinitions,
  moradUnitsCargoDefinitions,
  CargoDefinition,
} from './definitions'
import { CommandType } from '../commands'

const rootMenuName = 'Internal Cargo'

function internalOnly(definition: CargoDefinition) {
  return definition.internal === true
}

const internalBaseCargos = allBasesCargoDefinitions.filter(internalOnly)
const internalUnitCargos = allUnitsCargoDefinitions.filter(internalOnly)
const internalLightUnitCargos = lightUnitsCargoDefinitions.filter(internalOnly)
const internalHeavyUnitCargos = heavyUnitsCargoDefinitions.filter(internalOnly)
const internalArtilleryUnitCargos =
  artilleryUnitsCargoDefinitions.filter(internalOnly)
const internalShoradUnitCargos =
  shoradUnitsCargoDefinitions.filter(internalOnly)
const internalMoradUnitCargos = moradUnitsCargoDefinitions.filter(internalOnly)

export const internalCargoMenu = groupMenu({
  async create({ groupName }) {
    const rootMenu = await addGroupCommandSubMenu({
      groupName,
      name: rootMenuName,
    })

    const rootPath = rootMenu.path

    if (!rootPath) {
      throw new Error('missing rootPath')
    }

    await addGroupCommand({
      groupName,
      name: 'Unpack Internal Cargo',
      path: rootPath,
      command: {
        type: CommandType.UnpackInternalCargo,
      },
    })

    const basesMenu = await addGroupCommandSubMenu({
      groupName,
      name: 'Bases',
      path: rootPath,
    })

    const basesPath = basesMenu.path

    if (!basesPath) {
      throw new Error('missing basesPath')
    }

    for (const baseCargoDefinition of internalBaseCargos) {
      const name = baseCargoDefinition.displayName
      const cargoDefinitionId = baseCargoDefinition.id

      await addGroupCommand({
        groupName,
        name,
        path: basesPath,
        command: {
          type: CommandType.LoadInternalCargo,
          cargoDefinitionId,
        },
      })
    }

    // Units menu
    const unitsMenu = await addGroupCommandSubMenu({
      groupName,
      name: 'Units',
      path: rootPath,
    })

    if (!unitsMenu.path) {
      throw new Error('missing path on unitsMenu')
    }

    // Supplies and Utility
    const suppliesMenu = await addGroupCommandSubMenu({
      groupName,
      name: 'Supplies & Utility',
      path: unitsMenu.path,
    })

    const unitsSuppliesPath = suppliesMenu.path

    if (!unitsSuppliesPath) {
      throw new Error('missing unitsSuppliesPath')
    }

    for (const unitCargoDefinition of internalUnitCargos) {
      const name = unitCargoDefinition.displayName
      const cargoDefinitionId = unitCargoDefinition.id

      await addGroupCommand({
        groupName,
        name,
        path: unitsSuppliesPath,
        command: {
          type: CommandType.LoadInternalCargo,
          cargoDefinitionId,
        },
      })
    }

    // Light Units
    const unitsLightMenu = await addGroupCommandSubMenu({
      groupName,
      name: 'Light Units',
      path: unitsMenu.path,
    })

    const unitsLightPath = unitsLightMenu.path

    if (!unitsLightPath) {
      throw new Error('missing unitsLightPath')
    }

    for (const unitCargoDefinition of internalLightUnitCargos) {
      const name = unitCargoDefinition.displayName
      const cargoDefinitionId = unitCargoDefinition.id

      await addGroupCommand({
        groupName,
        name,
        path: unitsLightPath,
        command: {
          type: CommandType.LoadInternalCargo,
          cargoDefinitionId,
        },
      })
    }

    // Heavy Units
    const unitsHeavyMenu = await addGroupCommandSubMenu({
      groupName,
      name: 'Heavy Units',
      path: unitsMenu.path,
    })

    const unitsHeavyPath = unitsHeavyMenu.path

    if (!unitsHeavyPath) {
      throw new Error('missing unitsHeavyPath')
    }

    for (const unitCargoDefinition of internalHeavyUnitCargos) {
      const name = unitCargoDefinition.displayName
      const cargoDefinitionId = unitCargoDefinition.id

      await addGroupCommand({
        groupName,
        name,
        path: unitsHeavyPath,
        command: {
          type: CommandType.LoadInternalCargo,
          cargoDefinitionId,
        },
      })
    }

    // Artillery Units
    const unitsArtilleryMenu = await addGroupCommandSubMenu({
      groupName,
      name: 'Artillery Units',
      path: unitsMenu.path,
    })

    const unitsArtilleryPath = unitsArtilleryMenu.path

    if (!unitsArtilleryPath) {
      throw new Error('missing unitsArtilleryPath')
    }

    for (const unitCargoDefinition of internalArtilleryUnitCargos) {
      const name = unitCargoDefinition.displayName
      const cargoDefinitionId = unitCargoDefinition.id

      await addGroupCommand({
        groupName,
        name,
        path: unitsArtilleryPath,
        command: {
          type: CommandType.LoadInternalCargo,
          cargoDefinitionId,
        },
      })
    }

    // SHORAD Units
    const unitsShoradMenu = await addGroupCommandSubMenu({
      groupName,
      name: 'SHORAD Units',
      path: unitsMenu.path,
    })

    const unitsShoradPath = unitsShoradMenu.path

    if (!unitsShoradPath) {
      throw new Error('missing unitsShoradPath')
    }

    for (const unitCargoDefinition of internalShoradUnitCargos) {
      const name = unitCargoDefinition.displayName
      const cargoDefinitionId = unitCargoDefinition.id

      await addGroupCommand({
        groupName,
        name,
        path: unitsShoradPath,
        command: {
          type: CommandType.LoadInternalCargo,
          cargoDefinitionId,
        },
      })
    }

    // MORAD Units
    const unitsMoradMenu = await addGroupCommandSubMenu({
      groupName,
      name: 'MORAD Units',
      path: unitsMenu.path,
    })

    const unitsMoradPath = unitsMoradMenu.path

    if (!unitsMoradPath) {
      throw new Error('missing unitsMoradPath')
    }

    for (const unitCargoDefinition of internalMoradUnitCargos) {
      const name = unitCargoDefinition.displayName
      const cargoDefinitionId = unitCargoDefinition.id

      await addGroupCommand({
        groupName,
        name,
        path: unitsMoradPath,
        command: {
          type: CommandType.LoadInternalCargo,
          cargoDefinitionId,
        },
      })
    }

    await addGroupCommand({
      groupName,
      name: 'Destroy Internal Cargo',
      path: rootPath,
      command: {
        type: CommandType.DestroyInternalCargo,
      },
    })
    // End modification
  },
  async remove({ groupName }) {
    await removeGroupCommandItem({ groupName, path: [rootMenuName] })
  },
})
