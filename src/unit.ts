import { services } from './services'

import {
  _dcs_coalition_v0_AddGroupRequest_GroundGroupTemplate as GroundGroupTemplate,
  _dcs_coalition_v0_AddGroupRequest_GroundUnitTemplate as GroundUnitTemplate,
  _dcs_coalition_v0_AddGroupRequest_Skill as Skill,
} from '../generated/dcs/coalition/v0/AddGroupRequest'
import { Country } from '../generated/dcs/common/v0/Country'
import { GroupCategory } from '../generated/dcs/common/v0/GroupCategory'
import { Position } from '../generated/dcs/common/v0/Position'
import { StreamUnitsResponse__Output } from '../generated/dcs/mission/v0/StreamUnitsResponse'
import { Coalition } from '../generated/dcs/common/v0/Coalition'
import { deg, position3From, positionLLFrom, rad, vec3From } from './common'
import { Position3, Velocity } from './types'
import { countryFrom } from './country'
import { knex } from './db/db'
import { equal } from 'assert'

const { coalition } = services

export interface Unit {
  id: number
  name: string
  callsign: string | undefined
  coalition: Coalition
  type: string
  position: Position
  playerName: string | undefined
  groupName: string
  numberInGroup: number
}

export interface SpawnGroundUnitOptions {
  country: Country
  typeName: string
  position: Position
  unitId?: number
  name?: string
  heading?: number
}

export async function spawnGroundUnit({
  unitId,
  name: unitName,
  country,
  typeName,
  position,
  heading = 0,
}: SpawnGroundUnitOptions) {
  console.log('trying to spawn')
  return new Promise<void>((resolve, reject) => {
    const id = Math.floor(1000 + Math.random() * 9000)

    const name = unitName || `spawned unit ${id}`

    const unit: GroundUnitTemplate = {
      position,
      name,
      type: typeName,
      heading: rad(heading),
      skill: Skill.SKILL_AVERAGE,
    }

    const groundTemplate: GroundGroupTemplate = {
      name,
      task: 'Ground Nothing', // wtf is this for? what values are available?
      position,
      units: [unit],
    }

    if (typeof unitId === 'number') {
      unit.unitId = unitId
      groundTemplate.groupId = unitId
    }

    coalition.addGroup(
      {
        country,
        template: 'groundTemplate',
        groupCategory: GroupCategory.GROUP_CATEGORY_GROUND,
        groundTemplate,
      },
      (error, result) => {
        if (error) {
          console.log('add group failed', error)
          return reject(error)
        }
        console.log('add grounp', result)
        resolve()
      }
    )
  })
}

export async function destroy(unitName: string): Promise<void> {
  const lua = `
    Unit.getByName("${unitName}"):destroy()
`

  return new Promise<void>((resolve, reject) =>
    services.custom.eval({ lua }, (error, _result) => {
      if (error) {
        reject(error)
      }
      resolve()
    })
  )
}

export async function getPositionVelocity(
  unitName: string
): Promise<[Position3, Velocity]> {
  const lua = `
    local unit = Unit.getByName("${unitName}")
    local position = unit:getPosition()
    local velocity = unit:getVelocity()

    return { position, velocity }
`

  return new Promise<[Position3, Velocity]>((resolve, reject) =>
    services.custom.eval({ lua }, (error, result) => {
      if (error) {
        reject(error)
      }
      const [maybePosition3, maybeVelocity] = JSON.parse(result!.json!)

      const position = position3From(maybePosition3)
      const velocity = vec3From(maybeVelocity)

      resolve([position, velocity])
    })
  )
}

export function unitFrom(maybeUnit: StreamUnitsResponse__Output['unit']): Unit {
  if (!maybeUnit) {
    throw new Error('maybeUnit is falsy')
  }
  if ('id' in maybeUnit === false || typeof maybeUnit.id === 'undefined') {
    throw new Error('expected id to be a number')
  }
  if ('name' in maybeUnit === false || typeof maybeUnit.name === 'undefined') {
    throw new Error('expected name to be a string')
  }
  if (
    'coalition' in maybeUnit === false ||
    typeof maybeUnit.coalition === 'undefined'
  ) {
    throw new Error('expected coalition to be a string')
  }
  if ('type' in maybeUnit === false || typeof maybeUnit.type === 'undefined') {
    throw new Error('expected type to be a string')
  }
  if (
    'position' in maybeUnit === false ||
    typeof maybeUnit.position === 'undefined'
  ) {
    throw new Error('expected position to be a string')
  }
  if (
    'groupName' in maybeUnit === false ||
    typeof maybeUnit.groupName === 'undefined'
  ) {
    throw new Error('expected groupName to be a string')
  }
  if (
    'numberInGroup' in maybeUnit === false ||
    typeof maybeUnit.numberInGroup === 'undefined'
  ) {
    throw new Error('expected numberInGroup to be a string')
  }

  return {
    id: maybeUnit.id,
    name: maybeUnit.name,
    position: positionLLFrom(maybeUnit.position),
    callsign: maybeUnit.callsign,
    coalition: maybeUnit.coalition,
    type: maybeUnit.type,
    playerName: maybeUnit.playerName,
    groupName: maybeUnit.groupName,
    numberInGroup: maybeUnit.numberInGroup,
  }
}
