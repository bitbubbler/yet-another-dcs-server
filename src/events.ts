import { Subject } from 'rxjs'

import { Coalition } from './__generated__/dcs/common/v0/Coalition'
import { StreamEventsResponse__Output } from './__generated__/dcs/mission/v0/StreamEventsResponse'
import { Struct } from './__generated__/google/protobuf/Struct'
import { Value } from './__generated__/google/protobuf/Value'
import { Airbase__Output } from './__generated__/dcs/common/v0/Airbase'

import { services } from './services'
import { Command } from './commands/types'
import { parse, reader } from './commands'
import { Restarts } from './signals'
import { Group } from './group'
import { GameUnit, gameUnitFrom } from './unit'

const { mission } = services

export enum EventType {
  MarkAdd,
  MarkChange,
  GroupCommand,
  MissionCommand,
  Birth,
  PlayerSendChat,
  PilotDead,
  Land,
  Takeoff,
}

export interface EventShape {
  type: EventType
}

export interface Initiator {
  unit?: GameUnit
}

export interface MarkEvent {
  id: number
  initiator: Initiator
  coalition: Coalition
  text?: string
}

export interface MarkAddEvent extends EventShape, MarkEvent {
  type: EventType.MarkAdd
}

export interface MarkChangeEvent extends EventShape, MarkEvent {
  type: EventType.MarkChange
  command?: Command
}

export type DetailsValue =
  | null
  | boolean
  | string
  | number
  | DetailsValue[]
  | { [key: string]: DetailsValue }

export type DetailsValueShape = { [key: string]: DetailsValue }

export interface GroupCommandEvent extends EventShape {
  type: EventType.GroupCommand
  group: Group
  command: Command
}

export interface MissionCommandEvent extends EventShape {
  type: EventType.MissionCommand
  command: Command
}

export interface BirthEvent extends EventShape {
  type: EventType.Birth
  initiator: Initiator
  place: Airbase__Output | undefined
}
export interface PlayerSendChatEvent extends EventShape {
  type: EventType.PlayerSendChat
  playerId: number
  message: string
  command?: Command
}

export interface PilotDeadEvent extends EventShape {
  type: EventType.PilotDead
  unit: GameUnit
}

export interface LandEvent extends EventShape {
  type: EventType.Land
  unit: GameUnit
}
export interface TakeoffEvent extends EventShape {
  type: EventType.Takeoff
  unit: GameUnit
}

export type Event =
  | MarkAddEvent
  | MarkChangeEvent
  | GroupCommandEvent
  | MissionCommandEvent
  | BirthEvent
  | PlayerSendChatEvent
  | PilotDeadEvent
  | LandEvent
  | TakeoffEvent

export const Events = new Subject<Event>()

export function startEvents() {
  const call = mission.StreamEvents({})

  call.on('data', async (data: StreamEventsResponse__Output) => {
    // console.log('data', JSON.stringify(data, undefined, 2))
    try {
      await handleEvent(data)
    } catch (error) {
      console.log('handle event failed', error)
    }
  })

  call.on('error', error => {
    console.log('events error', error)
    Restarts.next()
  })

  call.on('end', () => {
    console.log('events end')
    Restarts.next()
  })
}

async function handleEvent(data: StreamEventsResponse__Output): Promise<void> {
  if ('markAdd' in data) {
    const { markAdd } = data

    // integrety validations
    if (!markAdd.id) {
      throw new Error('invalid markAdd event. missing id')
    }
    if (!markAdd.initiator) {
      throw new Error('invalid markAdd event. missing initiator')
    }
    if (!markAdd.coalition) {
      throw new Error('invalid markAdd event. missing coalition')
    }

    const { id, coalition, text } = markAdd

    const initiator = markAdd.initiator?.unit
      ? { unit: gameUnitFrom(markAdd.initiator.unit) }
      : {}

    if (text) {
      const event: MarkAddEvent = {
        type: EventType.MarkAdd,
        id,
        coalition,
        initiator,
        text,
      }

      return Events.next(event)
    }

    const event: MarkAddEvent = {
      type: EventType.MarkAdd,
      id,
      coalition,
      initiator,
    }

    return Events.next(event)
  }
  if ('markChange' in data) {
    const { markChange } = data

    // integrety validations
    if (!markChange.id) {
      throw new Error('invalid markChange event. missing id')
    }
    if (!markChange.initiator) {
      throw new Error('invalid markChange event. missing initiator')
    }
    if (!markChange.coalition) {
      throw new Error('invalid markChange event. missing coalition')
    }

    const { id, coalition, text } = markChange

    const initiator = markChange.initiator?.unit
      ? { unit: gameUnitFrom(markChange.initiator.unit) }
      : {}

    if (text) {
      try {
        const command = parse(reader(text))

        if (command && typeof command === 'object' && 'type' in command) {
          const event: MarkChangeEvent = {
            type: EventType.MarkChange,
            id,
            coalition,
            initiator,
            text,
            command,
          }

          return Events.next(event)
        }
      } catch (error) {
        // parsing failed, assume there is no command in the text
        // no-op
      }

      const event: MarkChangeEvent = {
        type: EventType.MarkChange,
        id,
        coalition,
        initiator,
        text,
      }

      return Events.next(event)
    }

    const event: MarkChangeEvent = {
      type: EventType.MarkChange,
      id,
      coalition,
      initiator,
    }

    return Events.next(event)
  }
  if ('missionCommand' in data) {
    const { missionCommand } = data

    // integrety validations
    if (!missionCommand.details) {
      throw new Error('invalid groupCommand event. missing details')
    }

    const { details } = missionCommand

    const event: MissionCommandEvent = {
      type: EventType.MissionCommand,
      command: detailsFrom(details) as unknown as Command, // assume this is a command
    }

    return Events.next(event)
  }
  if ('groupCommand' in data) {
    const { groupCommand } = data

    // integrety validations
    if (!groupCommand.group) {
      throw new Error('invalid groupCommand event. missing group')
    }
    if (!groupCommand.details) {
      throw new Error('invalid groupCommand event. missing details')
    }

    const { group, details } = groupCommand

    if (typeof group.id !== 'number') {
      throw new Error('invalid group. missing id')
    }
    if (!group.name) {
      throw new Error('invalid group. missing name')
    }
    if (!group.coalition) {
      throw new Error('invalid group. missing coalition')
    }
    if (!group.category) {
      throw new Error('invalid group. missing category')
    }

    const event: GroupCommandEvent = {
      type: EventType.GroupCommand,
      group: {
        id: group.id,
        name: group.name,
        coalition: group.coalition,
        category: group.category,
      },
      command: detailsFrom(details) as unknown as Command, // assume this is a command
    }

    return Events.next(event)
  }
  if ('birth' in data) {
    const { birth } = data

    if (!birth.initiator) {
      throw new Error('invalid birth. missing initiator')
    }

    const { place } = birth

    const initiator = birth.initiator?.unit
      ? { unit: gameUnitFrom(birth.initiator.unit) }
      : {}

    if (!initiator.unit) {
      // TODO: static objects get birth'd and don't have a unit
      // right now we just swallow those birth events by returning here
      return
    }

    const event: BirthEvent = {
      type: EventType.Birth,
      initiator,
      place,
    }

    return Events.next(event)
  }
  if ('playerSendChat' in data) {
    const { playerSendChat } = data

    const { playerId, message } = playerSendChat

    if (!playerId) {
      throw new Error('missing playerId from playerSendChat')
    }

    if (!message) {
      throw new Error('missing message from playerSendChat')
    }

    try {
      const command = parse(reader(message))

      const event: PlayerSendChatEvent = {
        type: EventType.PlayerSendChat,
        playerId,
        message,
        command,
      }

      return Events.next(event)
    } catch (error) {
      // parsing failed, assume no command
      // no-op
    }

    const event: PlayerSendChatEvent = {
      type: EventType.PlayerSendChat,
      playerId,
      message,
    }

    return Events.next(event)
  }
  if ('pilotDead' in data) {
    const { pilotDead } = data

    const { initiator } = pilotDead

    if (!initiator) {
      return
    }

    const { unit } = initiator

    if (!unit) {
      return
    }

    const event: PilotDeadEvent = {
      type: EventType.PilotDead,
      unit: gameUnitFrom(unit),
    }

    return Events.next(event)
  }
  if ('land' in data) {
    const { land } = data

    const { initiator } = land

    if (!initiator) {
      return
    }

    const { unit } = initiator

    if (!unit) {
      return
    }

    const event: LandEvent = {
      type: EventType.Land,
      unit: gameUnitFrom(unit),
    }

    return Events.next(event)
  }

  console.log('An untyped event:', JSON.stringify(data, null, 2))

  // no-op
}

export function detailsFrom(struct: Struct): DetailsValueShape {
  const details: DetailsValue = {}

  if (!struct.fields) {
    return details
  }

  const { fields } = struct

  Object.keys(fields).forEach(key => {
    const field = fields[key]

    details[key] = detaulsValueFrom(field)
  })

  return details
}

function detaulsValueFrom(field: Value): DetailsValue {
  if ('boolValue' in field) {
    return field.boolValue
  }
  if ('nullValue' in field) {
    return null
  }
  if ('stringValue' in field) {
    return field.stringValue
  }
  if ('numberValue' in field) {
    return field.numberValue
  }
  if ('listValue' in field) {
    const values = field.listValue?.values
    if (!values) {
      return []
    }
    const list: DetailsValue[] = []

    values.forEach(maybeValue => {
      list.push(detaulsValueFrom(maybeValue))
    })

    return list
  }

  throw new Error('unexpected trying to find value in field')
}

export function structFrom(details: DetailsValueShape): Struct {
  const struct: Struct = {
    fields: {},
  }

  Object.keys(details).forEach(key => {
    const field = details[key]

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    struct.fields![key] = valueFrom(field)
  })

  return struct
}

function valueFrom(value: DetailsValue): Value {
  if (typeof value === 'boolean') {
    return {
      boolValue: value,
      kind: 'boolValue',
    }
  }
  if (typeof value === null) {
    return {
      nullValue: 'NULL_VALUE',
      kind: 'nullValue',
    }
  }
  if (typeof value === 'string') {
    return {
      stringValue: value,
      kind: 'stringValue',
    }
  }
  if (typeof value === 'number') {
    return {
      numberValue: value,
      kind: 'numberValue',
    }
  }
  if (Array.isArray(value)) {
    return {
      listValue: {
        values: value.map(v => valueFrom(v)),
      },
      kind: 'listValue',
    }
  }
  if (typeof value === 'object' && value !== null) {
    return {
      structValue: structFrom(value),
      kind: 'structValue',
    }
  }

  throw new Error('unexpected trying to find value in field')
}
