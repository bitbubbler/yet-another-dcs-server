export type Argument = string | number

export enum CommandType {
  Unknown,
  Destroy,
  Spawn,
}

export interface CommandShape {
  type: CommandType
  args?: Argument[] // enforce the shape of generic args property on commands that choose to use it
}

export interface DestroyCommand extends Omit<CommandShape, 'args'> {
  type: CommandType.Destroy
}

export interface SpawnCommand extends Omit<CommandShape, 'args'> {
  type: CommandType.Spawn
  unitName: string
}

export interface UnknownCommand extends Omit<CommandShape, 'args'> {
  type: CommandType.Unknown
}

export type Command = DestroyCommand | SpawnCommand | UnknownCommand
