import { AStarPlanner } from '../Planner'
import { GotoAction, ScoutAction } from '../actions'
import { AIUnitType, WorldStatePartial } from '../types'
import { unitTypeActionMap } from '../unitTypeActionMap'
import { testWorldState } from './mock'

describe('src/ai/Planner', () => {
  describe('HMMWV', () => {
    const generateActions = unitTypeActionMap[AIUnitType.HMMWV]

    it('should plan a simple plan to scout a base', () => {
      const planner = new AStarPlanner()
      const baseId = 123
      const worldState = testWorldState({
        enemyBases: {
          [baseId]: {
            captured: false,
            position: { alt: 2, lat: 2, lon: 2 },
            scouted: false,
          },
        },
      })
      const goalState: WorldStatePartial = {
        enemyBases: {
          [baseId]: {
            position: { alt: 2, lat: 2, lon: 2 },
            scouted: true,
          },
        },
      }
      const availableActions = generateActions(goalState)

      if (availableActions.length < 1) {
        expect(availableActions.length).toBeGreaterThan(0)
        return
      }

      const newPlan = planner.plan({
        availableActions,
        goalState,
        currentState: worldState,
      })

      expect(newPlan.length).toBeGreaterThan(0)
      // contain at least one gotoAction
      expect(newPlan.find(action => action instanceof GotoAction)).toBeTruthy()
      // contain at least one scoutAction
      expect(newPlan.find(action => action instanceof ScoutAction)).toBeTruthy()
    })
  })
})
