import { Command, CommandType } from '../commands'
import { Events, EventType, MissionCommandEvent } from '../events'
import { reloadCurrentMission } from '../hook'
import { Restarts } from '../signals'
import { outText } from '../trigger'

export async function restartMissionMain(): Promise<() => Promise<void>> {
  const subscription = Events.subscribe(async event => {
    if (EventType.MissionCommand === event.type) {
      return handleMissionCommand(event as MissionCommandEvent)
    }
  })

  return async () => {
    subscription.unsubscribe()
  }
}

async function handleMissionCommand(event: MissionCommandEvent): Promise<void> {
  const details = event.details as unknown as Command

  const { type } = details

  if (CommandType.RestartMission === type) {
    const { delay = 10 } = details

    const miliseconds = 1000 * delay
    const seconds = Math.floor(miliseconds / 1000)

    outText(`The mission will restart in ${seconds} seconds`)

    setTimeout(async () => {
      await reloadCurrentMission()
      setTimeout(() => {
        Restarts.next()
      }, 1000)
    }, miliseconds)
  }
}
