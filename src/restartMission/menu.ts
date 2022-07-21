import { CommandType } from '../commands'
import { missionMenu } from '../menus'
import { addMissionCommand, removeMissionCommandItem } from '../mission'

const menuName = 'Restart Mission'

export const restartMissionMenu = missionMenu({
  async create() {
    await addMissionCommand({
      name: menuName,
      details: {
        type: CommandType.RestartMission,
      },
    })
  },
  async remove() {
    await removeMissionCommandItem({ path: [menuName] })
  },
})
