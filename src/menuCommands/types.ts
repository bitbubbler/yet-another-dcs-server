export type Argument = string | number

export enum CommandType {
  RestartMission,
  RestartMissionCancel,
  Spawn,
}

export interface CommandShape {
  type: CommandType
  args?: Argument[] // enforce the shape of generic args property on commands that choose to use it
}

export interface Spawn extends Omit<CommandShape, 'args'> {
  type: CommandType.Spawn
  typeName: string // the exact typename to spawn
}

export interface RestartMission extends Omit<CommandShape, 'args'> {
  type: CommandType.RestartMission
  delay?: number // number of seconds to wait before restarting, can be canceled during this time
}

export interface RestartMissionCancel extends Omit<CommandShape, 'args'> {
  type: CommandType.RestartMissionCancel
}

export type Command = RestartMission | RestartMissionCancel | Spawn
