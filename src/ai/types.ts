import { Base } from '../db'
import { GamePositionLL } from '../types'

export enum AIUnitType {
  HMMWV,
  APC,
  IFV,
  TANK,
}

/**
 * The world state for a single ai entity.
 * All ai entities should share a single WorldState Shape
 *
 * This should be used as the base shape for shared world states
 */
export interface WorldState {
  enemyPositions: GamePositionLL[]
  enemyBases: {
    [key: Base['baseId']]: {
      scouted: boolean
      captured: boolean
      position: GamePositionLL
    }
  }
  groupName: string
  currentPosition: GamePositionLL
}

export type UnitWorldState = WorldState

export type CoalitionWorldState = Pick<
  WorldState,
  'enemyBases' | 'enemyPositions'
>

/**
 * A Partial<WorldState> with some extra stuff for a pseudo deep partial
 *
 * Some properties should never be optional in a WorldStatePartial
 * like the properties of a GamePositionLL
 */
export interface WorldStatePartial
  extends Partial<
    Pick<WorldState, 'enemyPositions' | 'groupName' | 'currentPosition'>
  > {
  enemyBases?: Partial<{
    [key: Base['baseId']]:
      | Partial<WorldState['enemyBases'][Base['baseId']]>
      | undefined
  }>
}

/**
 * The result of an action
 */
export enum Feedback {
  SUCCESS,
  FAILURE,
  RUNNING,
}

export type GenerateActions = (goalState: WorldStatePartial) => ActionShape[]

export abstract class Goal {
  /**
   * A method that returns the goals desired world state
   */
  public abstract getDesiredState(worldState: WorldState): WorldStatePartial
  /**
   * A method to determine if the goal is achievable. Used during goal selection
   */
  public abstract isAchievable(worldState: WorldState): boolean
  /**
   * A method to determine the priority of the goal.
   */
  public abstract priority(): number
}

export type ActionShape = DiscreteAction | ContinuousAction

export abstract class Action {
  public abstract cost: number
  public abstract effects: WorldStatePartial
  public abstract preconditions: WorldStatePartial

  /**
   * A method to check procedural preconditions of an action
   *
   * Use this for WorldState checks that don't fit into the declarative pattern
   */
  public abstract checkProceduralPreconditions(worldState: WorldState): boolean
  /**
   * The method used to execute the action
   */
  public abstract execute(worldState: WorldState): Feedback
  /**
   * A method for the Agent and Planner to determine if the parameters of two actions are equal
   */
  public abstract parametersAreEqual(a: Action, b: Action): boolean
}

export abstract class DiscreteAction extends Action {}

export abstract class ContinuousAction extends Action {
  /**
   * A method for the agent to tell if the action is complete.
   *
   * This method is intentionally sync to allow the tick loop to remain sync
   */
  public abstract isComplete(worldState: WorldState): boolean
}
