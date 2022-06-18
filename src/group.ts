import { Group } from '../generated/dcs/common/v0/Group'
import { services } from './services'
import { Unit, unitFrom } from './unit'

const { coalition, custom, group } = services

export async function groups(): Promise<Group[]> {
  return new Promise<Group[]>((resolve, reject) => {
    coalition.getGroups({}, (error, results) => {
      if (error) {
        console.log('get groups failed', error)
        return reject(error)
      }

      const { groups } = results!

      if (!groups) {
        // if the mission is empty, there will not be any groups on the response
        // it's not common but it is possible.
        return resolve([])
      }

      resolve(groups)
    })
  })
}

export async function getUnits(groupName: string): Promise<Unit[]> {
  return new Promise<Unit[]>((resolve, reject) => {
    group.getUnits(
      {
        groupName,
      },
      (error, result) => {
        if (error) {
          return reject(error)
        }

        if (!result || !result.units) {
          return reject(new Error('expected units on result'))
        }

        resolve(result.units.map(unit => unitFrom(unit)))
      }
    )
  })
}

export async function groupFromGroupId(
  groupId: number
): Promise<Group & Required<Pick<Group, 'id'>>> {
  const group = (await groups()).find(group => group.id === groupId)

  if (!group) {
    throw new Error('expected to find group in groups with given id')
  }

  return group as Group & Required<Pick<Group, 'id'>>
}

export async function groupFromGroupName(groupName: string): Promise<Group> {
  const group = (await groups()).find(group => group.name === groupName)

  if (!group) {
    throw new Error('expected to find group in groups with given name')
  }

  return group
}

export async function destroyGroup(groupName: string) {
  const lua = `
    return Group.getByName("${groupName}").destroy()
`
  return new Promise<void>((resolve, reject) => {
    custom.eval({ lua }, (error, result) => {
      // TODO: finish
    })
  })
}
