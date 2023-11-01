import { positionsEqual } from '../../coord'
import { driveGroundGroup } from '../../group'
import { GamePositionLL } from '../../types'
import {
  ContinuousAction,
  Feedback,
  WorldState,
  WorldStatePartial,
} from '../types'

export class GotoAction extends ContinuousAction {
  public effects: WorldStatePartial = {}
  public preconditions: WorldStatePartial = {}
  public cost = 1

  private arrived = false
  private failed = false
  private moving = false
  private target: GamePositionLL

  constructor(target: GamePositionLL) {
    super()
    this.target = target

    this.effects.currentPosition = target
  }

  public checkProceduralPreconditions(worldState: WorldState): boolean {
    // TODO: Determine if the path is clear??
    return true
  }

  public execute(worldState: WorldState): Feedback {
    if (this.failed) {
      return Feedback.FAILURE
    }

    if (this.checkProceduralPreconditions(worldState)) {
      // Don't update the units missions if we're already moving (let dcs own movement)
      if (!this.moving) {
        const groupName = worldState.groupName
        const destination = this.target
        const position = worldState.currentPosition

        console.log(
          `GotoAction - MOVING - ${groupName} ${position} ${destination}`
        )

        driveGroundGroup({
          destination,
          groupName,
          onroad: false,
          points: [],
          position,
        })
          .then(() => {
            // no-op success
          })
          .catch((error: unknown) => {
            this.failed = true
            console.error(error)
            console.error(
              `GotoAction failed while attempting to drive the unit. See logs above.`
            )
          })

        this.moving = true
      }

      // update arrived based on unit position in worldState every time we execute
      this.arrived =
        worldState.currentPosition.lat === this.target.lat &&
        worldState.currentPosition.lon === this.target.lon

      // TODO: handle unit never arriving
      // ex: stuck, pathfinding issues in dcs, etc.

      return this.arrived ? Feedback.SUCCESS : Feedback.RUNNING
    }
    return Feedback.FAILURE
  }

  public isComplete(_worldState: WorldState): boolean {
    return this.failed || this.arrived
  }

  public parametersAreEqual(a: GotoAction, b: GotoAction): boolean {
    return positionsEqual(a.target, b.target)
  }
}
