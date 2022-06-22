import fuzzysort from 'fuzzysort'
import {
  Events,
  EventType,
  MarkChangeEvent,
} from '../events'
import { illumination, removeMapMark, signalFlare, smoke } from '../trigger'
import { getMarkById } from '../custom'
import { CommandType as EventCommandType } from '../commands/types'
import { randomAngleDeg } from '../common'

// const colorArray = Object.keys(SmokeColor).filter((v) => isNaN(Number(v))) can be used alternatively, but uses DCS smoke color names
const smokeColor:string[] = [
  'unspecified',
  'green',
  'red',
  'white',
  'orange',
  'blue'
] 

const flareColor:string[] = [
  'unspecified',
  'green',
  'red',
  'white',
  'yellow'
] 

export async function main(): Promise<() => Promise<void>> {
    const subscription = Events.subscribe(async event => {
      if (EventType.MarkChange === event.type) {
        return handleMarkChangeEvent(event as MarkChangeEvent)
      }
    })

  return async () => {
    subscription.unsubscribe()
  }
}

async function handleMarkChangeEvent(event: MarkChangeEvent) {
  const { id, command } = event
  // attempt to handle command(s) from markers
  
  if (command) {
    if (EventCommandType.Smoke === command.type) {
      const addedMark = await getMarkById(id)

      if (!addedMark) {
        throw new Error('expected addedMark')
      }

      let color = 1 //default green smoke
      
      if (command.color){
        color = match(command.color, smokeColor)
      }

      await smoke(
        addedMark.position, 
        color,
      )

      // remove the map marker
      await removeMapMark(id)
    }
    if (EventCommandType.Flare === command.type) {
      const addedMark = await getMarkById(id)

      if (!addedMark) {
        throw new Error('expected addedMark')
      }

      let color = 1 //default green flare
      const azimuth = randomAngleDeg()
      
      if (command.color){
        color = match(command.color, flareColor)
      }

      await signalFlare(
        addedMark.position, 
        color,
        azimuth
      )

      // remove the map marker
      await removeMapMark(id)
    }
    if (EventCommandType.Illumination === command.type) {
      const addedMark = await getMarkById(id)

      if (!addedMark) {
        throw new Error('expected addedMark')
      }

      await illumination(
        addedMark.position
      )

      // remove the map marker
      await removeMapMark(id)
    }
  }
}

//try to match color string with available colors
function match(input: string, colors: string[]){
  const result = fuzzysort.go(input, colors)

  if (!result[0]) {
    throw new Error('missing result from fuzzysort')
  }

  return colors.indexOf(result[0].target)
}