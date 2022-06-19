// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import fuzzysort from 'fuzzysort'
import {
  GROUND_UNITS,
  AIR_DEFENCE,
  ARTILLERY,
  EveryObject,
} from '../everyObject'

export function searchUnits(input: string): EveryObject {
  const unitToSpawn: EveryObject | undefined = match(input)

  if (typeof unitToSpawn === 'undefined') {
    throw new Error(`failed to find unit matching input: ${input}`)
  }

  return unitToSpawn
}

const lookups = [GROUND_UNITS, AIR_DEFENCE, ARTILLERY].reduce<EveryObject[]>(
  (previous, map) => previous.concat(Array.from(map.values())),
  []
)

function match(input: string): EveryObject {
  const result = fuzzysort.go(input, lookups, {
    keys: ['desc.displayName', 'desc.typeName'],
  })

  if (!result[0]) {
    throw new Error('missing result from fuzzysort')
  }

  return result[0].obj
}
