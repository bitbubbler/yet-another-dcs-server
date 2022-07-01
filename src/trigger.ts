import { services } from './services'
import { PositionLL } from './types'
import { _dcs_trigger_v0_SmokeRequest_SmokeColor as SmokeColor } from '../generated/dcs/trigger/v0/SmokeRequest'
import { _dcs_trigger_v0_SignalFlareRequest_FlareColor as FlareColor } from '../generated/dcs/trigger/v0/SignalFlareRequest'

const { trigger, net } = services

export async function outUnitText(playerId: number, message: string) {
  return new Promise<void>((resolve, reject) =>
    net.SendChatTo(
      {
        targetPlayerId: playerId,
        message,
      },
      (error, _result) => {
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
      (error, _result) => {
        if (error) {
          return reject(error)
        }
        resolve()
      }
    )
  )
}

export async function outText(text: string, displayTime = 10) {
  return new Promise<void>((resolve, reject) =>
    trigger.outText(
      {
        displayTime, // what format is this? seconds?
        clearView: false,
        text,
      },
      (error, _result) => {
        if (error) {
          return reject(error)
        }
        resolve()
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
        console.log('remove mark', result)
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
