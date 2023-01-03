import { Coalition } from './generated/dcs/common/v0/Coalition'
import { Country } from './generated/dcs/common/v0/Country'

export function countryFrom(coalition: Coalition): Country {
  if (coalition === Coalition.COALITION_BLUE) {
    return Country.COUNTRY_COMBINED_JOINT_TASK_FORCE_BLUE
  }
  if (coalition === Coalition.COALITION_RED) {
    return Country.COUNTRY_COMBINED_JOINT_TASK_FORCE_RED
  }
  // TODO: determine if this is a safe default
  return Country.COUNTRY_UNITED_NATIONS_PEACEKEEPERS
}
