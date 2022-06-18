import { services } from './services'

const { hook } = services

export async function reloadCurrentMission(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    hook.reloadCurrentMission({}, (error, _result) => {
      if (error) {
        return reject(error)
      }
      resolve()
    })
  })
}
