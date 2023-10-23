import { Coalition } from './__generated__/dcs/common/v0/Coalition'
import { Country } from './__generated__/dcs/common/v0/Country'

export function coalitionFrom(country: Country): Coalition {
  if (country === Country.COUNTRY_COMBINED_JOINT_TASK_FORCE_RED) {
    return Coalition.COALITION_RED
  }
  if (country === Country.COUNTRY_COMBINED_JOINT_TASK_FORCE_BLUE) {
    return Coalition.COALITION_BLUE
  }
  // TODO: determine if this is a safe default
  return Coalition.COALITION_NEUTRAL
}
