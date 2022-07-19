import { Coalition } from '../../generated/dcs/common/v0/Coalition'
import { SpawnerType } from '../autoRespawn/types'

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
  CreateSpawner,
}

export enum ToDestroy {
  Unit,
  Spawner,
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
  toDestroy: ToDestroy | undefined
  radius: number | undefined
  coalition: Coalition | undefined
}

export interface SpawnCommand extends Omit<CommandShape, 'args'> {
  type: CommandType.Spawn
  units: { fuzzyUnitName: string; count?: number }[]
  coalition: Coalition | undefined
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

export interface CreateSpawner extends Omit<CommandShape, 'args'> {
  type: CommandType.CreateSpawner
  coalition: Coalition | undefined
  spawnerType: SpawnerType | undefined
  onRoad: boolean | undefined
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
  | CreateSpawner
