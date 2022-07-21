import { services } from './services'

import {
  _dcs_coalition_v0_AddGroupRequest_GroundGroupTemplate as GroundGroupTemplate,
  _dcs_coalition_v0_AddGroupRequest_GroundUnitTemplate as GroundUnitTemplate,
  _dcs_coalition_v0_AddGroupRequest_Skill as Skill,
} from '../generated/dcs/coalition/v0/AddGroupRequest'
import { Country } from '../generated/dcs/common/v0/Country'
import { GroupCategory } from '../generated/dcs/common/v0/GroupCategory'
import { StreamUnitsResponse__Output } from '../generated/dcs/mission/v0/StreamUnitsResponse'
import { Coalition } from '../generated/dcs/common/v0/Coalition'
import {
  position3From,
  positionLLFrom,
  rad,
  randomPositionInCircle,
  randomPositionOnCircle,
  vec3From,
} from './common'
import { Position3, PositionLL, Velocity } from './types'
import { knex, Unit as DbUnit } from './db'

const { coalition } = services

export interface Unit {
  id: number
  name: string
  callsign: string | undefined
  coalition: Coalition
  type: string
  position: PositionLL
  playerName: string | undefined
  groupName: string | undefined
  numberInGroup: number | undefined
}

export interface SpawnGroundUnitOptions {
  country: Country
  typeName: string
  position: Pick<PositionLL, 'lat' | 'lon'>
  unitId?: number
  name?: string
  heading?: number
}

export async function spawnGroundUnitsOnCircle(
  country: Country,
  focus: PositionLL,
  radius: number,
  units: Pick<DbUnit, 'typeName'>[]
) {
  const circleUnits = units.map(unit => ({
    ...unit,
    position: randomPositionOnCircle(focus, radius),
  }))

  await Promise.all(
    circleUnits.map(async unitToSpawn => {
      const { typeName, position } = unitToSpawn

      await spawnGroundUnit({
        country,
        typeName,
        position,
      })
    })
  )
}

export async function spawnGroundUnitsInCircle(
  country: Country,
  focus: PositionLL,
  radius: number,
  units: Pick<DbUnit, 'typeName'>[]
) {
  return Promise.all(
    units.map(unit => spawnGroundUnitInCircle(country, focus, radius, unit))
  )
}

export async function spawnGroundUnitInCircle(
  country: Country,
  focus: PositionLL,
  radius: number,
  unit: Pick<DbUnit, 'typeName'>
) {
  const position = randomPositionInCircle(focus, radius)

  const { typeName } = unit

  return spawnGroundUnit({
    country,
    typeName,
    position,
  })
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
  return new Promise<{ groupName: string }>(async (resolve, reject) => {
    const name = unitName || (await uniqueUnitName())

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
        console.log('add group', result)
        resolve({
          groupName: name,
        })
      }
    )
  })
}

export async function uniqueUnitName(): Promise<string> {
  const id = Math.floor(1000 + Math.random() * 9000)

  const name = `spawned unit ${id}`

  // check that the name is not already in use
  const existingUnit = await knex('units')
    .select('unitId')
    .where({ name })
    .first()

  // if the name is alredy in use
  if (existingUnit) {
    // try again
    return uniqueUnitName()
  }

  // otherwise return this name
  return name
}

export async function destroy(unitName: string): Promise<void> {
  const lua = `Unit.getByName("${unitName}"):destroy()`
  return new Promise<void>((resolve, reject) =>
    services.custom.eval({ lua }, error => {
      if (error) {
        return reject(error)
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
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
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
