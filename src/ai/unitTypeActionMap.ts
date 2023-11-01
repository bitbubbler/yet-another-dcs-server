import { todo } from '../util'
import { GotoAction, ScoutAction } from './actions'
import { AIUnitType, Action, GenerateActions, WorldStatePartial } from './types'

/**
 * A map of unit type to a function that will generate actions for that unit type
 */
export const unitTypeActionMap: { [key in AIUnitType]: GenerateActions } = {
  [AIUnitType.HMMWV]: function generateHmmwvActions(
    goalState: WorldStatePartial
  ): Action[] {
    const actions: Action[] = []

    // If desired state has a position, we can fulfill that with a goto action
    if ('currentPosition' in goalState) {
      actions.push(new GotoAction(goalState.currentPosition))
    }

    // If desired state has an enemyBase in it, we want to inspect `captured` and `scouted`
    if ('enemyBases' in goalState && goalState.enemyBases) {
      // for every enemyBase in goalState
      for (const [baseId, base] of Object.entries(
        goalState.enemyBases
      ) as unknown as [
        number,
        NonNullable<
          Required<Required<WorldStatePartial>['enemyBases']>[number]
        >,
      ][]) {
        if (base?.scouted && base?.position) {
          actions.push(new GotoAction(base.position))
          actions.push(new ScoutAction(baseId, base.position))
        }
      }
    }

    return actions
  },
  [AIUnitType.APC]: () => todo(),
  [AIUnitType.IFV]: () => todo(),
  [AIUnitType.TANK]: () => todo(),
}
