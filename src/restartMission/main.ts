import { Restarts } from '../signals'
import { Events, EventType, MissionCommandEvent } from '../events'
import { reloadCurrentMission } from '../hook'
import { MenuCommand, MenuCommandType } from '../menuCommands/types'
import { addMissionCommand, removeMissionCommandItem } from '../mission'
import { outText } from '../trigger'

export async function restartMissionMain(): Promise<() => Promise<void>> {
  await createRestartMissionMenu()

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
  const details = event.details as unknown as MenuCommand

  const { type } = details

  if (MenuCommandType.RestartMission === type) {
    const { delay = 10 } = details

    const miliseconds = 1000 * delay
    const seconds = Math.floor(miliseconds / 1000)
    const minutes = Math.floor(miliseconds / 60000)

    outText(`The mission will restart in ${seconds} seconds`)

    setTimeout(async () => {
      await reloadCurrentMission()
      setTimeout(() => {
        Restarts.next()
      }, 1000)
    }, miliseconds)
  }
}

async function createRestartMissionMenu(): Promise<void> {
  const menuName = 'Restart Mission'

  await removeMissionCommandItem({ path: [menuName] })

  await addMissionCommand({
    name: menuName,
    details: {
      type: MenuCommandType.RestartMission,
    },
  })
}
