import fuzzysort from 'fuzzysort'
import { Events, EventType, MarkChangeEvent } from '../events'
import { illumination, removeMapMark, signalFlare, smoke } from '../trigger'
import { getMarkById } from '../custom'
import { CommandType as EventCommandType } from '../commands/types'
import { randomAngleDeg } from '../common'
import { _dcs_trigger_v0_SmokeRequest_SmokeColor as SmokeColor } from '../../generated/dcs/trigger/v0/SmokeRequest'
import { _dcs_trigger_v0_SignalFlareRequest_FlareColor as FlareColor } from '../../generated/dcs/trigger/v0/SignalFlareRequest'

// defines available colors
const colors: string[] = ['green', 'red', 'white', 'orange', 'blue', 'yellow']

//these intervals are set to one grenade at a time for smoke and illum.
const SMOKE_INTERVAL_SECONDS = 300
const FLARE_INTERVAL_SECONDS = 10
const ILLUMINATION_INVTERVAL_SECONDS = 180

type Color = typeof colors[number]

export async function visualMarkersMain(): Promise<() => Promise<void>> {
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

      let color = SmokeColor.SMOKE_COLOR_GREEN //default green smoke

      if (command.color != undefined) {
        const colorMatch = match(command.color, colors)
        if (isColor(colorMatch)) {
          color = smokeColorFrom(colorMatch)
        } else {
          console.log('invalid smoke color, using green')
        }
      }

      await smoke(addedMark.position, color)

      // if duration is set by the user, deploy smoke in interval
      if (command.duration != undefined) {
        const timerID = setInterval(
          async () => await smoke(addedMark.position, color),
          SMOKE_INTERVAL_SECONDS * 1000
        )
        setTimeout(() => clearInterval(timerID), command.duration * 60 * 1000)
      }
      // remove the map marker
      await removeMapMark(id)
    }
    if (EventCommandType.Flare === command.type) {
      const addedMark = await getMarkById(id)

      if (!addedMark) {
        throw new Error('expected addedMark')
      }

      let color = FlareColor.FLARE_COLOR_GREEN //default green flare
      const azimuth = randomAngleDeg()

      if (command.color != undefined) {
        const colorMatch = match(command.color, colors)
        if (isColor(colorMatch)) {
          color = flareColorFrom(colorMatch)
        } else {
          console.log('invalid flare color, using green')
        }
      }

      await signalFlare(addedMark.position, color, azimuth)

      // if duration is set by the user, repeat flaring in interval
      if (command.duration != undefined) {
        const timerID = setInterval(
          async () => await signalFlare(addedMark.position, color, azimuth),
          FLARE_INTERVAL_SECONDS * 1000
        )
        setTimeout(() => clearInterval(timerID), command.duration * 60 * 1000)
      }

      // remove the map marker
      await removeMapMark(id)
    }
    if (EventCommandType.Illumination === command.type) {
      const addedMark = await getMarkById(id)

      if (!addedMark) {
        throw new Error('expected addedMark')
      }

      await illumination(addedMark.position)

      // if duration is set by the user, repeat illumination in interval
      if (command.duration != undefined) {
        const timerID = setInterval(
          async () => await illumination(addedMark.position),
          ILLUMINATION_INVTERVAL_SECONDS * 1000
        )
        setTimeout(() => clearInterval(timerID), command.duration * 60 * 1000)
      }

      // remove the map marker
      await removeMapMark(id)
    }
  }
}

// try to match color string with available colors
function match(input: string, colors: string[]) {
  const result = fuzzysort.go(input, colors)

  if (!result[0]) {
    throw new Error('missing result from fuzzysort')
  }

  return result[0].target
}

// check if string is available color
function isColor(color: string): color is Color {
  return colors.includes(color as Color)
}

// use color enums from DCS
function smokeColorFrom(color: Color): SmokeColor {
  if (color == 'green') {
    return SmokeColor.SMOKE_COLOR_GREEN
  }
  if (color == 'red') {
    return SmokeColor.SMOKE_COLOR_RED
  }
  if (color == 'white') {
    return SmokeColor.SMOKE_COLOR_WHITE
  }
  if (color == 'orange') {
    return SmokeColor.SMOKE_COLOR_ORANGE
  }
  if (color == 'blue') {
    return SmokeColor.SMOKE_COLOR_BLUE
  }
  return SmokeColor.SMOKE_COLOR_GREEN
}

function flareColorFrom(color: Color): FlareColor {
  if (color == 'green') {
    return FlareColor.FLARE_COLOR_GREEN
  }
  if (color == 'red') {
    return FlareColor.FLARE_COLOR_RED
  }
  if (color == 'white') {
    return FlareColor.FLARE_COLOR_WHITE
  }
  if (color == 'yellow') {
    return FlareColor.FLARE_COLOR_YELLOW
  }
  return FlareColor.FLARE_COLOR_GREEN
}
