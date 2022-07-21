import { Subject } from 'rxjs'

import { Coalition } from '../generated/dcs/common/v0/Coalition'
import { GroupCategory } from '../generated/dcs/common/v0/GroupCategory'
import { Unit } from '../generated/dcs/common/v0/Unit'
import { StreamEventsResponse__Output } from '../generated/dcs/mission/v0/StreamEventsResponse'
import { Struct } from '../generated/google/protobuf/Struct'
import { Value } from '../generated/google/protobuf/Value'
import { Airbase__Output } from '../generated/dcs/common/v0/Airbase'

import { services } from './services'
import { Command } from './commands/types'
import { parse, reader } from './commands'
import { Restarts } from './signals'

const { mission } = services

export enum EventType {
  MarkAdd,
  MarkChange,
  GroupCommand,
  MissionCommand,
  Birth,
  PlayerSendChat,
}

export interface EventShape {
  type: EventType
}

export interface Initiator {
  unit: Unit
}

export interface MarkEvent {
  id: number
  initiator: Partial<Initiator>
  coalition: Coalition
  text?: string
}

export interface MarkAddEvent extends EventShape, MarkEvent {}

export interface MarkChangeEvent extends EventShape, MarkEvent {
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
  group: {
    id: number
    name: string
    coalition: Coalition
    category: GroupCategory
  }
  details: DetailsValueShape
}

export interface MissionCommandEvent extends EventShape {
  type: EventType.MissionCommand
  details: DetailsValueShape
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

export type Event =
  | MarkAddEvent
  | MarkChangeEvent
  | GroupCommandEvent
  | MissionCommandEvent
  | BirthEvent
  | PlayerSendChatEvent

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

    const { id, coalition, initiator, text } = markAdd

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

    const { id, coalition, initiator, text } = markChange

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
      details: detailsFrom(details),
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
      details: detailsFrom(details),
    }

    return Events.next(event)
  }
  if ('birth' in data) {
    const { birth } = data

    if (!birth.initiator) {
      throw new Error('invalid birth. missing initiator')
    }

    const { initiator, place } = birth

    if (!initiator.unit) {
      throw new Error('invalid initiator. missing unit')
    }

    const event: BirthEvent = {
      type: EventType.Birth,
      initiator: {
        unit: initiator.unit,
      },
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
