import { DetailsValueShape } from '../events'
import { Command } from './types'

/**
 * A function to serialize commands so they can be passed into menus
 * This function should not be used for anything but menus!!
 */
export function serialize(command: Command): DetailsValueShape {
  return JSON.parse(JSON.stringify(command))
}
