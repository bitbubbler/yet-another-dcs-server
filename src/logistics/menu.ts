import {
  addGroupCommand,
  addGroupCommandSubMenu,
  removeGroupCommandItem,
} from '../mission'
import { groupMenu } from '../menus'
import { allBasesCargoDefinitions } from './definitions'
import { CommandType } from '../commands'

const rootMenuName = 'Internal Cargo'

const internalBasesCargos = allBasesCargoDefinitions.filter(
  definition => definition.internal === true
)

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

    for (const basesCargoDefinition of internalBasesCargos) {
      const name = basesCargoDefinition.displayName
      const cargoDefinitionId = basesCargoDefinition.id

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
  },
  async remove({ groupName }) {
    await removeGroupCommandItem({ groupName, path: [rootMenuName] })
  },
})
