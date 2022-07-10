export type Argument = string | number

export enum MenuCommandType {
  RestartMission,
  RestartMissionCancel,
  Spawn,
  ShowSpawners,
  HideSpawners,
}

export interface CommandShape {
  type: MenuCommandType
  args?: Argument[] // enforce the shape of generic args property on commands that choose to use it
}

export interface Spawn extends Omit<CommandShape, 'args'> {
  type: MenuCommandType.Spawn
  typeName: string // the exact typename to spawn
}

export interface RestartMission extends Omit<CommandShape, 'args'> {
  type: MenuCommandType.RestartMission
  delay?: number // number of seconds to wait before restarting, can be canceled during this time
}

export interface RestartMissionCancel extends Omit<CommandShape, 'args'> {
  type: MenuCommandType.RestartMissionCancel
}

export interface ShowSpawners extends Omit<CommandShape, 'args'> {
  type: MenuCommandType.ShowSpawners
}

export interface HideSpawners extends Omit<CommandShape, 'args'> {
  type: MenuCommandType.HideSpawners
}

export type MenuCommand =
  | RestartMission
  | RestartMissionCancel
  | Spawn
  | ShowSpawners
  | HideSpawners
