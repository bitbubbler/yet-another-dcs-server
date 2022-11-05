import { Coalition } from '../generated/dcs/common/v0/Coalition'
import { Country } from '../generated/dcs/common/v0/Country'
import { countryFrom } from './country'
import { services } from './services'

const { hook } = services

export interface GameSlot extends Omit<Slot, 'country'> {
  countryName: string
}

export interface Slot {
  country: Country
  groupName: string | undefined
  groupSize: number
  multicrew_place: number
  onboard_numb: string
  role: string
  task: string
  type: string
  unitId: string
}

export async function getAvailableSlots(
  coalition: Coalition.COALITION_BLUE | Coalition.COALITION_RED
): Promise<GameSlot[]> {
  const side = coalition === Coalition.COALITION_BLUE ? 'blue' : 'red'
  return new Promise((resolve, reject) =>
    hook.eval(
      { lua: `return DCS.getAvailableSlots("${side}")` },
      (error, result) => {
        if (error) {
          return reject(error)
        }

        if (!result?.json) {
          return reject(Error('missing json from result'))
        }

        const json = JSON.parse(result.json)

        if (Array.isArray(json)) {
          return resolve(json)
        }

        return resolve([])
      }
    )
  )
}

/**
 * Returns an array of player slots
 */
export async function getPlayerSlots(): Promise<Slot[]> {
  const [redGameSlots, blueGameSlots] = await Promise.all([
    getAvailableSlots(Coalition.COALITION_RED),
    getAvailableSlots(Coalition.COALITION_BLUE),
  ])

  const redSlots: Slot[] = redGameSlots.map(
    gameSlotToSlot(Coalition.COALITION_RED)
  )
  const blueSlots: Slot[] = blueGameSlots.map(
    gameSlotToSlot(Coalition.COALITION_BLUE)
  )

  return redSlots.concat(blueSlots)
}

function gameSlotToSlot(coalition: Coalition): (gameSlot: GameSlot) => Slot {
  return gameSlot => {
    const {
      groupName,
      groupSize,
      multicrew_place,
      onboard_numb,
      role,
      task,
      type,
      unitId,
    } = gameSlot

    const slot: Slot = {
      country: countryFrom(coalition),
      groupName,
      groupSize,
      multicrew_place,
      onboard_numb,
      role,
      task,
      type,
      unitId,
    }

    return slot
  }
}
