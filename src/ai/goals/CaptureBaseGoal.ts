import { distanceBetween } from '../../coord'
import { Goal, WorldState, WorldStatePartial } from '../types'

export class CaptureBaseGoal extends Goal {
  public getDesiredState(worldState: WorldState): WorldStatePartial {
    // Find the closest scouted but uncaptured base
    let closestBaseId: string | null = null
    let closestBaseDistance: number = Number.MAX_VALUE

    for (const [baseId, base] of Object.entries(worldState.enemyBases)) {
      if (base.scouted && !base.captured) {
        const distance = distanceBetween(
          worldState.currentPosition,
          base.position
        )
        if (distance < closestBaseDistance) {
          closestBaseDistance = distance
          closestBaseId = baseId
        }
      }
    }

    if (closestBaseId !== null) {
      return {
        enemyBases: {
          [closestBaseId]: { captured: true },
        },
      }
    }

    return {}
  }

  public isAchievable(worldState: WorldState): boolean {
    return Object.values(worldState.enemyBases).some(
      base => base.scouted && !base.captured
    )
  }

  public priority(): number {
    return 1
  }
}
