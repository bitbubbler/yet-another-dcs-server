import { positionsEqual } from '../../coord'
import { GamePositionLL } from '../../types'
import {
  ContinuousAction,
  Feedback,
  WorldState,
  WorldStatePartial,
} from '../types'

const REQUIRED_SCOUTING_TIME_MS = 1000 * 10

export class ScoutAction extends ContinuousAction {
  public effects: WorldStatePartial = {}
  public preconditions: WorldStatePartial = {}
  public cost = 1

  /**
   * Bool indicating if the unit has moved from the target during scouting
   * Moving causes this action to fail
   */
  private moved = false
  /**
   * Bool indicating if scouting is in progress
   */
  private scouting = false
  /**
   * Bool indicating if the target has been scouted successfully
   */
  private scouted = false
  /**
   * Unix timestamp in ms since epoch. The time that scouting started at
   */
  private scoutingStartedAtMs?: number
  /**
   * If this action has failed
   */
  private failed = false
  /**
   * Target position to scout
   */
  private target: GamePositionLL

  constructor(baseId: number, position: GamePositionLL) {
    super()

    this.target = position
    this.preconditions.currentPosition = position
    this.effects.enemyBases = {
      [baseId]: {
        scouted: true,
      },
    }
  }

  public checkProceduralPreconditions(worldState: WorldState): boolean {
    // TODO: Determine if unit is at position??
    return true
  }

  public execute(worldState: WorldState): Feedback {
    if (this.failed) {
      return Feedback.FAILURE
    }

    if (this.checkProceduralPreconditions(worldState)) {
      // Track scouting start time if not started
      if (!this.scouting) {
        this.scoutingStartedAtMs = new Date().getTime()
      }

      if (!this.scoutingStartedAtMs) {
        throw new Error(
          'scoutingStartedAt was undefined but we expected a unix timestamp'
        )
      }

      this.moved = !positionsEqual(this.target, worldState.currentPosition)

      // If the unit has moved since we started scouting, fail the action
      if (this.moved) {
        this.failed = true
        return Feedback.FAILURE
      }

      // Update if scouting is complete every time we execute
      this.scouted =
        new Date().getTime() - this.scoutingStartedAtMs >=
        REQUIRED_SCOUTING_TIME_MS

      return this.scouted ? Feedback.SUCCESS : Feedback.RUNNING
    }
    return Feedback.FAILURE
  }

  public isComplete(_worldState: WorldState): boolean {
    return this.failed || this.scouted
  }

  public parametersAreEqual(a: ScoutAction, b: ScoutAction): boolean {
    if (
      a.target.alt === b.target.alt &&
      a.target.lat === b.target.lat &&
      a.target.lon === b.target.lon
    ) {
      return true
    }

    return false
  }
}
