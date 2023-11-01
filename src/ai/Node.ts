import { Action, WorldState } from './types'

export class Node {
  public parent?: Node
  public runningCost: number
  public worldState: WorldState
  public action?: Action
  public heuristicCost = 0

  constructor({
    action,
    parent,
    runningCost,
    worldState,
  }: {
    action?: Action
    parent?: Node
    runningCost: number
    worldState: WorldState
  }) {
    if (action) {
      this.action = action
    }
    if (parent) {
      this.parent = parent
    }
    this.runningCost = runningCost
    this.worldState = worldState
  }

  public fCost(): number {
    return this.runningCost + this.heuristicCost
  }
}
