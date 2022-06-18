import { services } from './services'

const { hook } = services

export type SlotID = string
export interface Slot {
  countryName: string
  groupName: string
  groupSize: number
  multicrew_place: number
  onboard_numb: string
  role: string
  task: string
  type: string
  unitId: string
}

export async function getAvailableSlots(
  coalition: 'blue' | 'red'
): Promise<Slot[]> {
  return new Promise((resolve, reject) =>
    hook.eval(
      { lua: `return DCS.getAvailableSlots(${coalition})` },
      (error, result) => {
        if (error) {
          return reject(error)
        }
        const { json } = result!

        if (!json) {
          throw new Error('expect json on result')
        }

        const availableSlots = JSON.parse(json) as Slot[]

        resolve(availableSlots)
      }
    )
  )
}
