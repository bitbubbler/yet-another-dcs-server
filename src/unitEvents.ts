import { Subject } from 'rxjs'

import { GroupCategory } from '../generated/dcs/common/v0/GroupCategory'
import { StreamUnitsResponse__Output } from '../generated/dcs/mission/v0/StreamUnitsResponse'
import { positionLLFrom } from './common'
import { countryFrom } from './country'

import { services } from './services'
import { Restarts } from './signals'
import { GameUnit, unitFrom } from './unit'

const { mission } = services

export enum UnitEventType {
  Update,
  Gone,
}

export interface UnitEventShape {
  type: UnitEventType
}

export interface UnitUpdateEvent extends UnitEventShape {
  type: UnitEventType.Update
  unit: GameUnit
}

export interface UnitGoneEvent extends UnitEventShape {
  type: UnitEventType.Gone
  unit: Pick<GameUnit, 'name'>
}

export type UnitEvent = UnitUpdateEvent | UnitGoneEvent

export const UnitEvents = new Subject<UnitEvent>()

export function startUnitEvents(): void {
  const call = mission.streamUnits({
    pollRate: 5,
    maxBackoff: 5,
    category: GroupCategory.GROUP_CATEGORY_UNSPECIFIED,
  })

  call.on('data', async (data: StreamUnitsResponse__Output) => {
    // console.log('unit data', JSON.stringify(data, undefined, 2))
    try {
      await handleUnitEvent(data)
    } catch (error) {
      console.log('handle event failed', error)
    }
  })
  call.on('error', error => {
    console.log('unit events error', error)
    Restarts.next()
  })

  call.on('end', () => {
    console.log('unit events end')
    Restarts.next()
  })
}

async function handleUnitEvent(
  event: StreamUnitsResponse__Output
): Promise<void> {
  if ('unit' in event) {
    try {
      return UnitEvents.next({
        type: UnitEventType.Update,
        unit: unitFrom(event.unit),
      })
    } catch (error) {
      console.log('failed to handle unit event', event)
    }
  }
  if ('gone' in event) {
    const { gone } = event

    if (typeof gone.id === 'undefined') {
      throw new Error('expected id on gone')
    }
    if (typeof gone.name === 'undefined') {
      throw new Error('expected name on gone')
    }

    return UnitEvents.next({
      type: UnitEventType.Gone,
      unit: {
        name: gone.name,
      },
    })
  }
}
