import { Loaded } from '@mikro-orm/core'
import { Coalition } from '../__generated__/dcs/common/v0/Coalition'
import { Base, Unit } from '../db'
import { emFork } from '../db/connection'
import { GamePositionLL } from '../types'
import { todo } from '../util'
import { AStarPlanner } from './Planner'
import {
  Action,
  ContinuousAction,
  DiscreteAction,
  Feedback,
  GenerateActions,
  Goal,
  UnitWorldState,
} from './types'

export class UnitAgent {
  /**
   * The coalition of the unit this agent is controlling
   */
  private coalition: Coalition.COALITION_BLUE | Coalition.COALITION_RED
  /**
   * The index of the current action to execute.
   */
  private currentActionIndex = 0
  /**
   * The current plan for the agent to execute.
   */
  private currentPlan: Array<DiscreteAction | ContinuousAction> = []
  /**
   * The type of unit this agent is controlling
   */
  private generateActions: GenerateActions
  /**
   * The goals this agent should try to accomplish
   */
  private goals: Goal[]
  /**
   * The planner used by this agent.
   */
  private planner: AStarPlanner
  /**
   * The unit id this agent is controlling.
   */
  private unitId: number
  /**
   * The world state for agent, it's goals, and it's actions.
   */
  private worldState: UnitWorldState

  constructor({
    coalition,
    generateActions,
    goals,
    groupName,
    position,
    unitId,
  }: {
    coalition: Coalition.COALITION_BLUE | Coalition.COALITION_RED
    generateActions: GenerateActions
    goals: Goal[]
    groupName: string
    position: GamePositionLL
    unitId: number
  }) {
    this.coalition = coalition
    this.generateActions = generateActions
    this.goals = goals
    this.planner = new AStarPlanner()
    this.unitId = unitId
    this.worldState = {
      enemyPositions: [],
      enemyBases: {},
      groupName,
      currentPosition: position,
    }
  }

  /**
   * A syncronous method to execute the next action in the currentPlan
   *
   * This method MUST be syncronous. This CANNOT be implemented async.
   * Reasons Why:
   * - This method is called on every ai tick. Our goal TPS is typically 60.
   *    To meet this goal we can't use promises (they are inherently slower).
   * - This method relies on the `currentPlan` remaining the same until it's done
   *    executing. Using a sync method here makes it far easier to reason
   *    about when other methods can safely replace `currentPlan`
   */
  public executeNextAction(): void {
    if (
      this.currentPlan.length > 0 &&
      this.currentActionIndex < this.currentPlan.length
    ) {
      const currentAction = this.currentPlan.at(this.currentActionIndex)

      if (!currentAction) {
        throw new Error(
          `Expected an action at index ${this.currentActionIndex}`
        )
      }

      if (
        'isComplete' in currentAction &&
        !currentAction.isComplete(this.worldState)
      ) {
        const feedback = currentAction.execute(this.worldState)

        if (feedback === Feedback.RUNNING) {
          return
        }

        if (feedback === Feedback.SUCCESS) {
          this.currentActionIndex++
          return
        }

        if (feedback === Feedback.FAILURE) {
          todo()
        }
      } else {
        const feedback = currentAction.execute(this.worldState)

        if (feedback === Feedback.RUNNING) {
          throw new Error(
            `Discrete actions must never returned Feedback.RUNNING`
          )
        }

        if (feedback === Feedback.SUCCESS) {
          this.currentActionIndex++
          return
        }

        if (feedback === Feedback.FAILURE) {
          todo()
        }
      }
    }
  }

  public halt(): void {
    // TODO: implement
  }

  public replan(): void {
    const goal = this.selectGoal()

    if (!goal) {
      console.warn(`No goal found for unit ${this.unitId}`)
      return
    }

    const goalState = goal.getDesiredState(this.worldState)
    const availableActions = this.generateActions(goalState)

    if (availableActions.length < 1) {
      console.warn(`No actions found for unit ${this.unitId}`)
      return
    }

    const newPlan = this.planner.plan({
      availableActions,
      goalState,
      currentState: this.worldState,
    })

    if (this.isPlanEqual(this.currentPlan, newPlan)) {
      // If the plans are equal, don't replace the currentPlan
      return
    }

    // We assume that it's safe to replace the `currentPlan` because we only
    // consume it in sync functions elsewhere
    this.currentPlan = newPlan
  }

  public async updateWorldState(): Promise<void> {
    const em = await emFork()
    const unitRepository = em.getRepository(Unit)
    const baseRepository = em.getRepository(Base)
    const unit = await unitRepository.findOne({ unitId: this.unitId })

    const enemyBases = await baseRepository.find({
      coalition: oppositeCoalition(this.coalition),
    })

    if (!unit) {
      throw new Error(`Failed to find unit ${this.unitId} in the database`)
    }

    // Update unit position with state from the database
    this.worldState.currentPosition = unit.position
    // Update the enemy bases with state from the database
    // Merge to preserve the things the unit knows about each base
    this.worldState.enemyBases = mergeEnemyBases(
      this.worldState.enemyBases,
      serializeEnemyBases(enemyBases)
    )
  }

  private isPlanEqual(a: Action[], b: Action[]) {
    if (a.length !== b.length) {
      return false
    }

    for (let i = 0; i < a.length; i++) {
      const actionA = a.at(i)
      const actionB = b.at(i)

      if (!actionA || !actionB) {
        return false
      }

      if (actionA.constructor !== actionB.constructor) {
        return false
      }

      if (!actionA.parametersAreEqual(actionA, actionB)) {
        return false
      }
    }

    // If all actions are of the same type and have the same parameters, plans are equal
    return true
  }

  private selectGoal(): Goal | undefined {
    const achievableGoals = this.goals.filter(goal =>
      goal.isAchievable(this.worldState)
    )

    let topGoal: Goal | undefined = undefined

    for (const goal of achievableGoals) {
      if (!topGoal) {
        topGoal = goal
        continue
      }

      if (goal.priority > topGoal.priority) {
        topGoal = goal
        continue
      }
    }

    return topGoal
  }
}

function oppositeCoalition(
  coalition: Coalition.COALITION_BLUE | Coalition.COALITION_RED
): Coalition {
  if (coalition === Coalition.COALITION_BLUE) {
    return Coalition.COALITION_RED
  }
  return Coalition.COALITION_BLUE
}

function serializeEnemyBases(
  bases: Loaded<Base>[]
): UnitWorldState['enemyBases'] {
  const enemyBases: UnitWorldState['enemyBases'] = {}

  for (const base of bases) {
    const enemyBase: UnitWorldState['enemyBases'][Base['baseId']] = {
      captured: false,
      position: base.position,
      scouted: false,
    }

    enemyBases[base.baseId] = enemyBase
  }

  return enemyBases
}

/**
 * Merges two enemyBases sets
 *
 * While this function does not modify a or b.
 * We simulate merging b into a
 */
function mergeEnemyBases(
  a: UnitWorldState['enemyBases'],
  b: UnitWorldState['enemyBases']
): UnitWorldState['enemyBases'] {
  const enemyBases: UnitWorldState['enemyBases'] = JSON.parse(JSON.stringify(a))

  for (const [bBaseId, bBase] of Object.entries(b) as unknown as [
    number,
    UnitWorldState['enemyBases'][number],
  ][]) {
    // TODO: aBase here is assumed to have all the properties, and exist
    //    in reality it often doesn't exist. And we need a way to describe
    //    this accurate with types.
    const aBase = a[bBaseId]
    const captured = aBase?.captured || bBase?.captured || false
    const scouted = aBase?.scouted || bBase?.scouted || false
    const enemyBase: UnitWorldState['enemyBases'][Base['baseId']] = {
      captured,
      position: bBase.position,
      scouted,
    }

    enemyBases[bBaseId] = enemyBase
  }

  return enemyBases
}
