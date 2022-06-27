import { Unit } from '../db'

export type Argument = string | number

export enum CommandType {
  Unknown,
  Destroy,
  Spawn,
  DefineSpawnGroup,
  SpawnGroup,
  Smoke,
  Flare,
  Illumination,
}

export interface CommandShape {
  type: CommandType
  args?: Argument[] // enforce the shape of generic args property on commands that choose to use it
}

export interface DefineSpawnGroupCommand extends Omit<CommandShape, 'args'> {
  type: CommandType.DefineSpawnGroup
  groupName: string
  units: { fuzzyUnitName: string }[]
}

export interface DestroyCommand extends Omit<CommandShape, 'args'> {
  type: CommandType.Destroy
}

export interface SpawnCommand extends Omit<CommandShape, 'args'> {
  type: CommandType.Spawn
  units: { fuzzyUnitName: string; count?: number }[]
}

export interface SpawnGroupCommand extends Omit<CommandShape, 'args'> {
  type: CommandType.SpawnGroup
  groupName: string
  radius?: number
}

export interface SmokeCommand extends Omit<CommandShape, 'args'> {
  type: CommandType.Smoke
  color?: string
}

export interface FlareCommand extends Omit<CommandShape, 'args'> {
  type: CommandType.Flare
  color?: string
}

export interface IlluminationCommand extends Omit<CommandShape, 'args'> {
  type: CommandType.Illumination
}

export interface UnknownCommand extends Omit<CommandShape, 'args'> {
  type: CommandType.Unknown
}

export type Command =
  | UnknownCommand
  | DefineSpawnGroupCommand
  | DestroyCommand
  | SpawnCommand
  | SpawnGroupCommand
  | SmokeCommand
  | FlareCommand
  | IlluminationCommand
