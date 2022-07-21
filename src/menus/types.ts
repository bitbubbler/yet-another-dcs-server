export enum MenuType {
  Mission,
  Group,
}

export interface MenuBase<TOptions> {
  create(options: TOptions): Promise<void>
  remove(options: TOptions): Promise<void>
}

export interface GroupMenu extends MenuBase<{ groupName: string }> {
  type: MenuType.Group
}

export interface MissionMenu extends MenuBase<void> {
  type: MenuType.Mission
}

export type Menu = GroupMenu | MissionMenu
