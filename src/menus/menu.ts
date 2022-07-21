import { GroupMenu, MissionMenu, MenuType } from './types'

export function missionMenu(menu: Omit<MissionMenu, 'type'>): MissionMenu {
  return {
    type: MenuType.Mission,
    ...menu,
  }
}

export function groupMenu(menu: Omit<GroupMenu, 'type'>): GroupMenu {
  return {
    type: MenuType.Group,
    ...menu,
  }
}
