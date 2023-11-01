import { positionsEqual } from '../coord'
import { objectEntries, todo } from '../util'
import { Node } from './Node'
import { ActionShape, WorldState, WorldStatePartial } from './types'

export class AStarPlanner {
  private openList: Node[] = []
  private closedList: Node[] = []

  public plan({
    availableActions,
    goalState,
    currentState: startState,
  }: {
    availableActions: ActionShape[]
    goalState: WorldStatePartial
    currentState: WorldState
  }): ActionShape[] {
    // A starting node.
    const startNode = new Node({ runningCost: 0, worldState: startState })
    startNode.heuristicCost = this.heuristic(startState, goalState)
    this.openList.push(startNode)

    while (this.openList.length > 0) {
      // Sort the open list based on the fCost (but why??)
      this.openList.sort((a, b) => a.fCost() - b.fCost())
      /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion --
       * This is safe because the while is ensuring that items exist (more or less)
       */
      const currentNode = this.openList.shift()!

      if (goalAchieved(currentNode.worldState, goalState)) {
        // If the goal is achieved we have a valid plan.
        // Construct the plan and return it
        return this.reconstructPath(currentNode)
      }

      this.closedList.push(currentNode)

      const successors = this.getSuccessors({
        availableActions,
        currentNode,
      })

      for (const successor of successors) {
        if (
          this.closedList.find(node =>
            // BUG: figure out why world states don't equal
            worldStatesEqual(node.worldState, successor.worldState)
          )
        ) {
          continue
        }

        // Calculate and assign the heuristic cost to the successor
        successor.heuristicCost = this.heuristic(
          successor.worldState,
          goalState
        )

        const openNode = this.openList.find(node =>
          worldStatesEqual(node.worldState, successor.worldState)
        )

        if (!openNode || openNode.fCost() > successor.fCost()) {
          // Not in open list or better than the open node, so update/add
          if (!openNode) {
            this.openList.push(successor)
          } else {
            openNode.parent = currentNode
            openNode.runningCost = successor.runningCost
            openNode.heuristicCost = successor.heuristicCost
          }
        }
      }
    }

    return []
  }

  public halt(): void {
    // TODO: implement
  }

  /**
   * A method that returns an array of all possible actions based on a given worldState
   */
  private getSuccessors({
    availableActions,
    currentNode,
  }: {
    availableActions: ActionShape[]
    currentNode: Node
  }): Node[] {
    const successors: Node[] = []

    for (const action of availableActions) {
      if (
        arePreconditionsSatisfied(
          action.preconditions,
          currentNode.worldState
        ) &&
        action.checkProceduralPreconditions(currentNode.worldState)
      ) {
        const newState = applyEffects(currentNode.worldState, action.effects)
        const runningCost = action.cost // TODO: should we add the currentNode.fCost here

        const successor = new Node({
          parent: currentNode,
          action,
          runningCost,
          worldState: newState,
        })

        successors.push(successor)
      }
    }

    return successors
  }

  /**
   * A method to calculate the heuristic cost that drives the a* search
   * This method is critical in optimizing the chosen path
   */
  private heuristic(
    worldstate: WorldState,
    goalState: WorldStatePartial
  ): number {
    let heuristicCost = 0

    for (const key of Object.keys(goalState) as (keyof WorldState)[]) {
      // TODO: handle nested objects in worldState like position and target
      if (worldstate[key] === goalState[key]) {
        continue
      }
      // heuristCost +1 for every worldState key that is not equal
      heuristicCost++
    }

    return heuristicCost
  }

  private reconstructPath(node: Node): ActionShape[] {
    const path = []
    let currentNode: Node | undefined = node
    while (currentNode.parent) {
      if (currentNode.action) {
        path.unshift(currentNode.action)
      }
      currentNode = currentNode.parent
    }
    return path
  }
}

function goalAchieved(
  worldState: WorldState,
  goalState: WorldStatePartial
): boolean {
  // Loop over all properties on goalState, comparing them to worldState
  // return false early if we find any differences
  // return true at the end if everything matches
  for (const [key, value] of objectEntries(goalState as Required<WorldState>)) {
    switch (key) {
      case 'enemyPositions': {
        todo()
        break
      }
      case 'enemyBases': {
        for (const [baseId, goalBase] of objectEntries(
          value as Required<WorldStatePartial>['enemyBases']
        )) {
          const worldBase = worldState?.[key]?.[baseId] as
            | WorldState['enemyBases'][number]
            | undefined

          if (typeof goalBase === 'undefined') {
            if (typeof worldBase !== 'undefined') {
              return false
            }
            continue
          }

          if (typeof worldBase === 'undefined') {
            return false
          }

          if (goalBase.captured && goalBase.captured !== worldBase.captured) {
            return false
          }
          if (goalBase.scouted && goalBase.scouted !== worldBase.scouted) {
            return false
          }
          if (
            goalBase.position &&
            !positionsEqual(goalBase.position, worldBase.position)
          ) {
            return false
          }
        }
        break
      }
      case 'groupName': {
        // groupName cannot be undefined, typescriptism
        if (typeof value !== 'undefined') {
          if (
            !(
              worldState?.[key] ===
              (value as Required<WorldStatePartial>['groupName'])
            )
          ) {
            return false
          }
        }
        break
      }
      case 'currentPosition': {
        if (typeof value !== 'undefined') {
          if (
            !(
              worldState?.[key] ===
              (value as Required<WorldStatePartial>['currentPosition'])
            )
          ) {
            return false
          }
        }
        break
      }
      default:
        const exhaustiveCheck: never = key
        throw new Error(`Unhandled effects key: ${exhaustiveCheck}`)
    }
  }

  return true
}

function worldStatesEqual(a: WorldState, b: WorldState): boolean {
  // Loop over all properties on a, comparing them to b
  // return false early if we find any differences
  // return true at the end if everything matches
  for (const [key, value] of objectEntries(a as Required<WorldState>)) {
    switch (key) {
      case 'enemyPositions': {
        todo()
        break
      }
      case 'enemyBases': {
        for (const [baseId, aBase] of objectEntries(
          value as Required<WorldState>['enemyBases']
        )) {
          const bBase = b?.[key]?.[baseId] as
            | WorldState['enemyBases'][number]
            | undefined

          if (typeof aBase === 'undefined') {
            if (typeof bBase !== 'undefined') {
              return false
            }
            continue
          }

          if (typeof bBase === 'undefined') {
            return false
          }

          if (aBase.captured !== bBase.captured) {
            return false
          }
          if (aBase.scouted !== bBase.scouted) {
            return false
          }
          if (!positionsEqual(aBase.position, bBase.position)) {
            return false
          }
        }
        break
      }
      case 'groupName': {
        // groupName cannot be undefined, typescriptism
        if (typeof value !== 'undefined') {
          if (
            !(b?.[key] === (value as Required<WorldStatePartial>['groupName']))
          ) {
            return false
          }
        }
        break
      }
      case 'currentPosition': {
        if (typeof value !== 'undefined') {
          if (
            !(
              b?.[key] ===
              (value as Required<WorldStatePartial>['currentPosition'])
            )
          ) {
            return false
          }
        }
        break
      }
      default:
        const exhaustiveCheck: never = key
        throw new Error(`Unhandled effects key: ${exhaustiveCheck}`)
    }
  }

  return true
}

function arePreconditionsSatisfied(
  preconditions: WorldStatePartial,
  currentWorldState: WorldState
) {
  // Check if static preconditions of an action are met in the current world state
  return (Object.keys(preconditions) as (keyof WorldState)[]).every(
    key => currentWorldState[key] === preconditions[key]
  )
}

function applyEffects(
  worldState: WorldState,
  effects: WorldStatePartial
): WorldState {
  const finalState: WorldState = JSON.parse(JSON.stringify(worldState))

  /**
   * Here we implement a manual deepmerge.
   * We do this because there's some properties that should never be merged like positions
   * and arrays.
   *
   * This is also likely a bit faster than an actual deepmerge
   */
  for (const [key, value] of objectEntries(
    effects as Required<WorldStatePartial>
  )) {
    switch (key) {
      case 'enemyPositions': {
        todo()
        break
      }
      case 'enemyBases': {
        for (const [baseId, base] of objectEntries(
          value as Required<WorldStatePartial>['enemyBases']
        )) {
          if (!base) {
            continue
          }

          const finalBase = finalState[key][baseId]

          if (typeof base.captured !== 'undefined') {
            finalBase['captured'] = base.captured
          }
          if (typeof base.position !== 'undefined') {
            finalBase['position'] = base.position
          }
          if (typeof base.scouted !== 'undefined') {
            finalBase['scouted'] = base.scouted
          }
        }
        break
      }
      case 'groupName': {
        if (typeof value !== 'undefined') {
          finalState[key] = value as Required<WorldStatePartial>['groupName']
        }
        break
      }
      case 'currentPosition': {
        if (typeof value !== 'undefined') {
          finalState[key] =
            value as Required<WorldStatePartial>['currentPosition']
        }
        break
      }
      default:
        const exhaustiveCheck: never = key
        throw new Error(`Unhandled effects key: ${exhaustiveCheck}`)
    }
  }

  return finalState
}
