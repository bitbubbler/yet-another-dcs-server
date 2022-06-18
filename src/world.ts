import { WorldServiceClient as WorldService } from '../generated/dcs/world/v0/WorldService'
import { MarkPanel__Output as MarkPanel } from '../generated/dcs/common/v0/MarkPanel'
import { MarkPanelsMissingError } from './errors'
import { services } from './services'

export { MarkPanel }

const { world } = services

/**
 * this might fail if the user in is in a jtac/tac command/game masters slot. not sure why
 * @returns
 */
export async function getMarkPanels(): Promise<MarkPanel[]> {
  return new Promise<MarkPanel[]>((resolve, reject) =>
    world.getMarkPanels({}, async (error, result) => {
      if (error) {
        return reject(new MarkPanelsMissingError())
      }

      const { markPanels } = result!

      if (!markPanels) {
        return reject(new MarkPanelsMissingError())
      }

      resolve(markPanels)
    })
  )
}
