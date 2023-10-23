import { services } from './services'
import { PositionLL } from './common'
import { _dcs_trigger_v0_SmokeRequest_SmokeColor as SmokeColor } from './__generated__/dcs/trigger/v0/SmokeRequest'
import { _dcs_trigger_v0_SignalFlareRequest_FlareColor as FlareColor } from './__generated__/dcs/trigger/v0/SignalFlareRequest'
import { Coalition } from './__generated__/dcs/common/v0/Coalition'
import { Color__Output } from './__generated__/dcs/trigger/v0/Color'

const { trigger, net } = services

export async function outCoalitionText(
  coalition: Coalition,
  message: string,
  displayTime = 10
): Promise<void> {
  return new Promise((resolve, reject) => {
    trigger.OutTextForCoalition(
      {
        coalition,
        displayTime,
        text: message,
      },
      error => {
        if (error) {
          return reject(error)
        }
        resolve()
      }
    )
  })
}

export async function outUnitText(playerId: number, message: string) {
  return new Promise<void>((resolve, reject) =>
    net.SendChatTo(
      {
        targetPlayerId: playerId,
        message,
      },
      error => {
        if (error) {
          return reject(error)
        }
        resolve()
      }
    )
  )
}

export async function outGroupText(
  groupId: number,
  text: string,
  displayTime = 10
) {
  return new Promise<void>((resolve, reject) =>
    trigger.outTextForGroup(
      {
        groupId,
        displayTime, // what format is this? seconds?
        clearView: false,
        text,
      },
      error => {
        if (error) {
          return reject(error)
        }
        resolve()
      }
    )
  )
}

/** Send text to everyone */
export async function outText(text: string, displayTime = 10) {
  return new Promise<void>((resolve, reject) =>
    trigger.outText(
      {
        displayTime, // what format is this? seconds?
        clearView: false,
        text,
      },
      error => {
        if (error) {
          return reject(error)
        }
        resolve()
      }
    )
  )
}

type Color = Required<Color__Output>

/**
 *
 * @param options.unieqId A unique id used as a seed for the marker id
 * @returns The marker id, can be used for removal
 */
export async function markupTextToAll(options: {
  coalition: Coalition
  position: PositionLL
  lineColor: Color
  fillColor: Color
  fontSize: number
  readonly: boolean
  text: string
  uniqueId: number
}): Promise<number> {
  const {
    coalition,
    position,
    lineColor,
    fillColor,
    fontSize,
    readonly,
    text,
    uniqueId,
  } = options

  const lua = `
  local markId = ${uniqueId}
  local point = coord.LLtoLO(${position.lat}, ${position.lon}, ${position.alt})
  trigger.action.textToAll(${coalition - 1}, markId, point, { ${
    lineColor.red
  }, ${lineColor.green}, ${lineColor.blue}, ${lineColor.alpha} }, { ${
    fillColor.red
  }, ${fillColor.green}, ${fillColor.blue}, ${
    fillColor.alpha
  } }, ${fontSize}, ${readonly}, [[${text}]])

  return markId

`

  return new Promise((resolve, reject) => {
    services.custom.eval({ lua }, (error, result) => {
      if (error) {
        reject(error)
      }
      if (!result || !result.json) {
        reject(Error('missing result json'))
        return
      }

      resolve(JSON.parse(result.json))
    })
  })
}

export async function markToAll(options: {
  position: PositionLL
  text: string
  readonly?: boolean
}): Promise<void> {
  const { position, text, readonly = false } = options

  return new Promise((resolve, reject) =>
    trigger.markToAll(
      {
        position,
        readOnly: readonly,
        text,
      },
      (error, result) => {
        if (error) {
          console.log('failed to add mark to all', error)
          return reject(error)
        }
        resolve()
        console.log('added mark', result)
      }
    )
  )
}

export async function removeMapMark(id: number): Promise<void> {
  return new Promise((resolve, reject) =>
    trigger.removeMark(
      {
        id,
      },
      (error, result) => {
        if (error) {
          console.log('failed to remove mark', error)
          return reject(error)
        }
        resolve()
        console.log('removed mark', result)
      }
    )
  )
}

export async function smoke(position: PositionLL, color: SmokeColor) {
  return new Promise<void>((resolve, reject) => {
    trigger.smoke(
      {
        position,
        color,
      },
      (error, result) => {
        if (error) {
          console.log('smoke failed', error)
          return reject(error)
        }
        console.log('deploying smoke', result)
        resolve()
      }
    )
  })
}

export async function signalFlare(
  position: PositionLL,
  color: FlareColor,
  azimuth: number
) {
  return new Promise<void>((resolve, reject) => {
    trigger.signalFlare(
      {
        position,
        color,
        azimuth,
      },
      (error, result) => {
        if (error) {
          console.log('flare failed', error)
          return reject(error)
        }
        console.log('deploying flare', result)
        resolve()
      }
    )
  })
}

export async function illumination(position: PositionLL) {
  position.alt = 500 //drop illum bomb 500m AGL
  const power = 1

  return new Promise<void>((resolve, reject) => {
    trigger.illuminationBomb(
      {
        position,
        power,
      },
      (error, result) => {
        if (error) {
          console.log('illumination failed', error)
          return reject(error)
        }
        console.log('deploying illumination', result)
        resolve()
      }
    )
  })
}
