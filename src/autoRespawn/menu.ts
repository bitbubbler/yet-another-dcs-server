import { CommandType } from '../commands'
import {
  addMissionCommand,
  addMissionCommandSubMenu,
  removeMissionCommandItem,
} from '../mission'
import { missionMenu } from '../menus'

const menuName = 'Spawners'

export const spawnersMenu = missionMenu({
  async create() {
    const rootMenu = await addMissionCommandSubMenu({ name: menuName })

    const rootPath = rootMenu.path

    if (!rootPath) {
      throw new Error('missing rootPath')
    }

    await addMissionCommand({
      name: 'Show Spawners',
      path: rootPath,
      details: {
        type: CommandType.ShowSpawners,
      },
    })

    await addMissionCommand({
      name: 'Hide Spawners',
      path: rootPath,
      details: {
        type: CommandType.HideSpawners,
      },
    })
  },
  async remove() {
    await removeMissionCommandItem({ path: [menuName] })
  },
})
