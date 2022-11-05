import { ARTILLERY, IFV, MLRS, TANKS, TRUCKS } from '../everyObject'
import {
  addGroupCommand,
  addGroupCommandSubMenu,
  removeGroupCommandItem,
} from '../mission'
import { groupMenu } from '../menus'
import { Command, CommandType, serialize } from '../commands'
import { groupFromGroupName } from '../group'

const rootMenuName = 'Spawn Units'

export const spawnUnitsMenu = groupMenu({
  async create({ groupName }) {
    const rootMenu = await addGroupCommandSubMenu({
      groupName,
      name: rootMenuName,
    })

    const rootPath = rootMenu.path
    const spawnable = { IFV, MLRS, ARTILLERY, TRUCKS, TANKS }

    if (!rootPath) {
      throw new Error('missing rootPath')
    }

    await Promise.all(
      Object.keys(spawnable).map(async setName => {
        const set = spawnable[setName as keyof typeof spawnable]
        const name =
          setName.charAt(0).toUpperCase() + setName.toLowerCase().slice(1)

        const subMenu = await addGroupCommandSubMenu({
          groupName,
          name,
          path: rootPath,
        })

        const setPath = subMenu.path

        if (!setPath) {
          throw new Error('missing setPath')
        }

        await Promise.all(
          Array.from(set.values()).map(async data => {
            const { desc } = data

            if (!desc) {
              throw new Error('desc missing on data')
            }

            const group = await groupFromGroupName(groupName)

            const { typeName, displayName } = desc

            await addGroupCommand({
              groupName,
              name: displayName,
              path: setPath,
              command: {
                type: CommandType.SpawnGroundUnit,
                units: [{ fuzzyUnitName: typeName, count: 1 }],
                coalition: group.coalition,
              },
            })
          })
        )
      })
    )
  },
  async remove({ groupName }) {
    await removeGroupCommandItem({ groupName, path: [rootMenuName] })
  },
})
