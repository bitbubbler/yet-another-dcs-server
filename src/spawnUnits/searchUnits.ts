// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { findBestMatch } from 'string-similarity'
import { GROUND_UNITS, EveryObject } from '../everyObject'

export function searchUnits(input: string): EveryObject {
  const units = Array.from(GROUND_UNITS.values())

  const displayNames = units.map(unit => unit.desc!.displayName)
  // TODO: also use typeNames for fuzzy searching, compare accuracy on each lookup set to pick one
  const typeNames = units.map(unit => unit.desc!.typeName)

  const matchIndex = match(input, displayNames)

  const unitToSpawn: EveryObject | undefined = units[matchIndex]

  if (typeof unitToSpawn === 'undefined') {
    throw new Error(`failed to find unit matching input: ${input}`)
  }

  return unitToSpawn
}

function match(input: string, lookups: string[]): number {
  const { bestMatchIndex } = findBestMatch(input, lookups)

  return bestMatchIndex
}
