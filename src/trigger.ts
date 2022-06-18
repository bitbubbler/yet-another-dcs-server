import { services } from './services'

const { trigger } = services

export async function outGroupText(
  groupId: number,
  text: string,
  displayTime = 10
) {
  return new Promise<void>((resolve, reject) =>
    trigger.outTextForGroup(
      {
        groupId,
        displayTime, // what format is this? seconds?
        clearView: false,
        text,
      },
      (error, _result) => {
        if (error) {
          return reject(error)
        }
        resolve()
      }
    )
  )
}

export async function outText(text: string, displayTime = 10) {
  return new Promise<void>((resolve, reject) =>
    trigger.outText(
      {
        displayTime, // what format is this? seconds?
        clearView: false,
        text,
      },
      (error, _result) => {
        if (error) {
          return reject(error)
        }
        resolve()
      }
    )
  )
}

export async function removeMapMark(id: number): Promise<void> {
  return new Promise((resolve, reject) =>
    trigger.removeMark(
      {
        id,
      },
      (error, result) => {
        if (error) {
          console.log('failed to remove mark', error)
          return reject(error)
        }
        resolve()
        console.log('remove mark', result)
      }
    )
  )
}
