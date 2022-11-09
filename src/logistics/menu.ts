import {
  addGroupCommand,
  addGroupCommandSubMenu,
  removeGroupCommandItem,
} from '../mission'
import { groupMenu } from '../menus'
import {
  allBasesCargoDefinitions,
  allUnitsCargoDefinitions,
  CargoDefinition,
} from './definitions'
import { CommandType } from '../commands'

const rootMenuName = 'Internal Cargo'

function internalOnly(definition: CargoDefinition) {
  return definition.internal === true
}

const internalBaseCargos = allBasesCargoDefinitions.filter(internalOnly)
const internalUnitCargos = allUnitsCargoDefinitions.filter(internalOnly)

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

    const unitsMenu = await addGroupCommandSubMenu({
      groupName,
      name: 'Units',
      path: rootPath,
    })

    const unitsPath = unitsMenu.path

    if (!unitsPath) {
      throw new Error('missing unitsPath')
    }

    for (const unitCargoDefinition of internalUnitCargos) {
      const name = unitCargoDefinition.displayName
      const cargoDefinitionId = unitCargoDefinition.id

      await addGroupCommand({
        groupName,
        name,
        path: unitsPath,
        command: {
          type: CommandType.LoadInternalCargo,
          cargoDefinitionId,
        },
      })
    }
  },
  async remove({ groupName }) {
    await removeGroupCommandItem({ groupName, path: [rootMenuName] })
  },
})
