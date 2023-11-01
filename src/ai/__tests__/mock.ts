import { WorldState } from '../types'

export function testWorldState({
  currentPosition,
  enemyBases,
  enemyPositions,
  groupName,
}: Partial<WorldState> = {}): WorldState {
  return {
    currentPosition: currentPosition || { alt: 1, lat: 1, lon: 1 },
    enemyBases: enemyBases || {},
    enemyPositions: enemyPositions || [],
    groupName: groupName || '',
  }
}
