import {
  addGroupCommand,
  addGroupCommandSubMenu,
  removeGroupCommandItem,
} from '../mission'
import { groupMenu } from '../menus'
import { CommandType } from '../commands'

const rootMenuName = 'CSAR'

export const csarMenu = groupMenu({
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
      name: 'Go On Duty',
      path: rootPath,
      command: {
        type: CommandType.CsarGoOnDuty,
      },
    })
    await addGroupCommand({
      groupName,
      name: 'List Active CSAR',
      path: rootPath,
      command: {
        type: CommandType.CsarListActive,
      },
    })
    await addGroupCommand({
      groupName,
      name: 'Check Onboard',
      path: rootPath,
      command: {
        type: CommandType.CsarCheckOnboard,
      },
    })
    await addGroupCommand({
      groupName,
      name: 'Reqeust Smoke',
      path: rootPath,
      command: {
        type: CommandType.CsarRequestSmoke,
      },
    })
  },
  async remove({ groupName }) {
    await removeGroupCommandItem({ groupName, path: [rootMenuName] })
  },
})
