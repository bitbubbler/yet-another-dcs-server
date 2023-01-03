import { AddGroupCommandRequest } from './generated/dcs/mission/v0/AddGroupCommandRequest'
import { AddGroupCommandSubMenuRequest } from './generated/dcs/mission/v0/AddGroupCommandSubMenuRequest'
import { AddGroupCommandSubMenuResponse__Output } from './generated/dcs/mission/v0/AddGroupCommandSubMenuResponse'
import { AddMissionCommandRequest } from './generated/dcs/mission/v0/AddMissionCommandRequest'
import { AddMissionCommandSubMenuRequest } from './generated/dcs/mission/v0/AddMissionCommandSubMenuRequest'
import { AddMissionCommandSubMenuResponse__Output } from './generated/dcs/mission/v0/AddMissionCommandSubMenuResponse'
import { RemoveMissionCommandItemRequest } from './generated/dcs/mission/v0/RemoveMissionCommandItemRequest'
import { Command, serialize } from './commands'
import { structFrom } from './events'
import { services } from './services'

const { mission } = services

export async function removeMissionCommandItem({
  path,
}: {
  path: string[]
}): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const options: RemoveMissionCommandItemRequest = {
      path,
    }
    mission.removeMissionCommandItem(options, error => {
      if (error) {
        return reject(error)
      }
      resolve()
    })
  })
}

export async function addMissionCommand({
  name,
  command,
  path,
}: {
  name: string
  command: Command
  path?: string[]
}): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const options: AddMissionCommandRequest = {
      name,
      details: structFrom(serialize(command)),
    }
    if (path) {
      options.path = path
    }
    mission.addMissionCommand(options, error => {
      if (error) {
        return reject(error)
      }
      resolve()
    })
  })
}

export async function addMissionCommandSubMenu({
  name,
  path,
}: {
  name: string
  path?: string[]
}): Promise<AddMissionCommandSubMenuResponse__Output> {
  return new Promise<AddMissionCommandSubMenuResponse__Output>(
    (resolve, reject) => {
      const options: AddMissionCommandSubMenuRequest = {
        name,
      }
      if (path) {
        options.path = path
      }
      mission.addMissionCommandSubMenu(options, (error, result) => {
        if (error) {
          return reject(error)
        }
        if (!result || !result.path) {
          return reject(new Error('missing results'))
        }
        resolve(result)
      })
    }
  )
}

export async function removeGroupCommandItem({
  groupName,
  path,
}: {
  groupName: string
  path: string[]
}) {
  return new Promise<void>((resolve, reject) =>
    mission.removeGroupCommandItem({ groupName, path }, error => {
      if (error) {
        return reject(error)
      }
      resolve()
    })
  )
}

export async function addGroupCommand({
  groupName,
  name,
  command,
  path,
}: {
  groupName: string
  name: string
  command: Command
  path?: string[]
}): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const options: AddGroupCommandRequest = {
      groupName,
      name,
      details: structFrom(serialize(command)),
    }
    if (path) {
      options.path = path
    }
    mission.addGroupCommand(options, (error, result) => {
      if (error) {
        return reject(error)
      }
      if (!result) {
        return reject(new Error('missing results'))
      }
      resolve()
    })
  })
}

export async function addGroupCommandSubMenu({
  groupName,
  name,
  path,
}: {
  groupName: string
  name: string
  path?: string[]
}): Promise<AddGroupCommandSubMenuResponse__Output> {
  return new Promise<AddGroupCommandSubMenuResponse__Output>(
    (resolve, reject) => {
      const options: AddGroupCommandSubMenuRequest = {
        groupName,
        name,
      }
      if (path) {
        options.path = path
      }
      mission.addGroupCommandSubMenu(options, (error, result) => {
        if (error) {
          return reject(error)
        }
        if (!result || !result.path) {
          return reject(new Error('missing results'))
        }
        resolve(result)
      })
    }
  )
}
