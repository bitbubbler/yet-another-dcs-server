import { Coalition } from '../__generated__/dcs/common/v0/Coalition'
import { BaseType, SpawnerType } from '../db'
import { CargoDefinitionID } from '../logistics/definitions'

export type Argument = string | number

export enum CommandType {
  // Keep these in alphabetical order, please
  CheckInternalCargo,
  CreateSpawner,
  CsarGoOnDuty,
  CsarGoOffDuty,
  CsarCheckOnboard,
  CsarListActive,
  CsarRequestSignalFlare,
  CsarRequestSmoke,
  DefineSpawnGroup,
  Destroy,
  DestroyInternalCargo,
  Flare,
  HideSpawners,
  Identify,
  Illumination,
  LoadInternalCargo,
  RestartMission,
  RestartMissionCancel,
  ShowSpawners,
  Smoke,
  SpawnCargo,
  SpawnBase,
  SpawnGroundUnit,
  SpawnGroup,
  UnpackInternalCargo,
  Unknown,
}

export enum ToDestroy {
  Unit,
  Spawner,
  Cargo,
  Base,
}

export interface CommandShape {
  type: CommandType
  args?: Argument[] // enforce the shape of generic args property on commands that choose to use it
}

/**
 * Define command interfaces in
 */

/** */ // empty to allow a block above

export interface CheckInternalCargoCommand extends Omit<CommandShape, 'args'> {
  type: CommandType.CheckInternalCargo
}

export interface CreateSpawnerCommand extends Omit<CommandShape, 'args'> {
  type: CommandType.CreateSpawner
  coalition: Coalition | undefined
  spawnerType: SpawnerType | undefined
  onRoad: boolean | undefined
}

export interface CsarCheckOnboardCommand extends Omit<CommandShape, 'args'> {
  type: CommandType.CsarCheckOnboard
}

export interface CsarGoOnDutyCommand extends Omit<CommandShape, 'args'> {
  type: CommandType.CsarGoOnDuty
}
export interface CsarGoOffDutyCommand extends Omit<CommandShape, 'args'> {
  type: CommandType.CsarGoOffDuty
}

export interface CsarListActiveCommand extends Omit<CommandShape, 'args'> {
  type: CommandType.CsarListActive
}

export interface CsarRequestSignalFlareCommand
  extends Omit<CommandShape, 'args'> {
  type: CommandType.CsarRequestSignalFlare
}

export interface CsarRequestSmokeCommand extends Omit<CommandShape, 'args'> {
  type: CommandType.CsarRequestSmoke
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
export interface DestroyInternalCargoCommand
  extends Omit<CommandShape, 'args'> {
  type: CommandType.DestroyInternalCargo
}

export interface FlareCommand extends Omit<CommandShape, 'args'> {
  type: CommandType.Flare
  color?: string
}

export interface HideSpawnersCommand extends Omit<CommandShape, 'args'> {
  type: CommandType.HideSpawners
}

export interface IlluminationCommand extends Omit<CommandShape, 'args'> {
  type: CommandType.Illumination
}

export interface IdentifyCommand extends Omit<CommandShape, 'args'> {
  type: CommandType.Identify
}

export interface LoadInternalCargoCommand extends Omit<CommandShape, 'args'> {
  type: CommandType.LoadInternalCargo
  cargoDefinitionId: CargoDefinitionID
}

export interface SpawnBaseCommand extends Omit<CommandShape, 'args'> {
  type: CommandType.SpawnBase
  baseType: BaseType
  coalition: Coalition | undefined
  heading: number
}

export interface SpawnGroundUnitCommand extends Omit<CommandShape, 'args'> {
  type: CommandType.SpawnGroundUnit
  units: { fuzzyUnitName: string; count?: number; heading: number }[]
  coalition: Coalition | undefined
}

export interface SpawnCargoCommand extends Omit<CommandShape, 'args'> {
  type: CommandType.SpawnCargo
  cargoDefinitionId: CargoDefinitionID
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

export interface RestartMissionCommand extends Omit<CommandShape, 'args'> {
  type: CommandType.RestartMission
  delay?: number // number of seconds to wait before restarting, can be canceled during this time
}

export interface RestartMissionCancelCommand
  extends Omit<CommandShape, 'args'> {
  type: CommandType.RestartMissionCancel
}

export interface ShowSpawnersCommand extends Omit<CommandShape, 'args'> {
  type: CommandType.ShowSpawners
}

export interface UnpackInternalCargoCommand extends Omit<CommandShape, 'args'> {
  type: CommandType.UnpackInternalCargo
}

export interface UnknownCommand extends Omit<CommandShape, 'args'> {
  type: CommandType.Unknown
}

export type Command =
  | CheckInternalCargoCommand
  | CreateSpawnerCommand
  | CsarCheckOnboardCommand
  | CsarGoOnDutyCommand
  | CsarGoOffDutyCommand
  | CsarListActiveCommand
  | CsarRequestSignalFlareCommand
  | CsarRequestSmokeCommand
  | DefineSpawnGroupCommand
  | DestroyCommand
  | DestroyInternalCargoCommand
  | FlareCommand
  | HideSpawnersCommand
  | IdentifyCommand
  | IlluminationCommand
  | LoadInternalCargoCommand
  | RestartMissionCancelCommand
  | RestartMissionCommand
  | ShowSpawnersCommand
  | SmokeCommand
  | SpawnBaseCommand
  | SpawnCargoCommand
  | SpawnGroundUnitCommand
  | SpawnGroupCommand
  | UnpackInternalCargoCommand
  | UnknownCommand
