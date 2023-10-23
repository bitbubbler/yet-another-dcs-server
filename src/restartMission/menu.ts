import { CommandType } from '../commands'
import { missionMenu } from '../menus'
import {
  addMissionCommand,
  addMissionCommandSubMenu,
  removeMissionCommandItem,
} from '../mission'

const menuName = 'Restart Mission'

export const restartMissionMenu = missionMenu({
  async create() {
    const rootMenu = await addMissionCommandSubMenu({
      name: menuName,
    })

    const rootPath = rootMenu.path

    if (!rootPath) {
      throw new Error('missing rootPath')
    }

    await addMissionCommand({
      name: 'No',
      path: rootPath,
      command: {
        type: CommandType.Unknown,
      },
    })

    await addMissionCommand({
      name: 'Yes, I want to restart the server for everyone',
      path: rootPath,
      command: {
        type: CommandType.RestartMission,
      },
    })
  },
  async remove() {
    await removeMissionCommandItem({ path: [menuName] })
  },
})
