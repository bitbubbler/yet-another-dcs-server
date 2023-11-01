import { GamePositionLL } from '../../types'
import { GotoAction, ScoutAction } from '../actions'
import { AIUnitType, WorldStatePartial } from '../types'
import { unitTypeActionMap } from '../unitTypeActionMap'

describe('src/ai/unitTypeActionMap', () => {
  describe('HMMWV', () => {
    const generateActions = unitTypeActionMap[AIUnitType.HMMWV]

    it('should return a goto action', () => {
      const goalState: WorldStatePartial = {
        currentPosition: { alt: 1, lat: 1, lon: 1 },
      }
      const actions = generateActions(goalState)
      const gotoActions = actions.filter(action => action instanceof GotoAction)
      const gotoAction = gotoActions[0]

      expect(gotoActions.length).toEqual(1)
      expect(gotoAction.effects).toEqual({
        currentPosition: goalState.currentPosition,
      })
      expect(gotoAction.preconditions).toEqual({})
    })

    it('should return a scout action', () => {
      const baseId = 123
      const position: GamePositionLL = { alt: 1, lat: 1, lon: 1 }
      const goalState: WorldStatePartial = {
        enemyBases: {
          [baseId]: {
            scouted: true,
            position,
          },
        },
      }
      const actions = generateActions(goalState)
      const scoutActions = actions.filter(
        action => action instanceof ScoutAction
      )
      const scoutAction = scoutActions[0]

      expect(scoutActions.length).toEqual(1)
      expect(scoutAction.effects).toEqual({
        enemyBases: {
          [baseId]: {
            scouted: true,
          },
        },
      })
      expect(scoutAction.preconditions).toEqual({
        currentPosition: position,
      })
    })
  })
})
