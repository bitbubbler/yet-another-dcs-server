import { services } from './services'

import {
  _dcs_coalition_v0_AddGroupRequest_GroundGroupTemplate as GroundGroupTemplate,
  _dcs_coalition_v0_AddGroupRequest_GroundUnitTemplate as GroundUnitTemplate,
  _dcs_coalition_v0_AddGroupRequest_Skill as Skill,
} from '../generated/dcs/coalition/v0/AddGroupRequest'
import { Country } from '../generated/dcs/common/v0/Country'
import { GroupCategory } from '../generated/dcs/common/v0/GroupCategory'
import { StreamUnitsResponse__Output } from '../generated/dcs/mission/v0/StreamUnitsResponse'
import {
  position3From,
  positionLLFrom,
  rad,
  randomPositionInCircle,
  randomPositionOnCircle,
  vec3From,
} from './common'
import { Position3, PositionLL, Velocity } from './common'
import { knex, Unit as DBUnit, Position as DBPosition, insertUnit } from './db'
import { GetTransformResponse__Output } from '../generated/dcs/unit/v0/GetTransformResponse'
import { countryFrom } from './country'
import { Cargo } from './cargo'

const { coalition, custom, unit } = services

export interface Unit {
  country: Country
  /** heading in radians */
  heading: number
  /** if the unit is a slot (slots are player controlled) */
  isPlayerSlot: boolean
  name: string
  position: PositionLL
  typeName: string
  unitId: number
}

/**
 * The unit as represented by the game. Typically recieved from dcs-grpc or lua calls.
 *
 * NOTE: The `heading` returned by dcs-grpc is currently not the users real heading.
 * https://github.com/DCS-gRPC/rust-server/issues/159
 */
export type GameUnit = Omit<Unit, 'heading' | 'isPlayerSlot' | 'unitId'> & {
  groupName: string
  playerName: string | undefined
}

export interface PlayerUnit extends Unit {
  isPlayerSlot: true
}

export function isPlayerUnit(unit: Unit): unit is PlayerUnit {
  return unit.isPlayerSlot === true
}

export async function spawnGroundUnitsOnCircle(
  country: Country,
  focus: PositionLL,
  radius: number,
  units: Pick<Unit, 'typeName'>[]
) {
  const circleUnits = units.map(unit => ({
    ...unit,
    // use a dumb default alt of 0 here. We need to assume something,
    // but we don't really want to make a call to the game engine
    position: { ...randomPositionOnCircle(focus, radius), alt: 0 },
  }))

  await Promise.all(
    circleUnits.map(async unitToSpawn => {
      const unit = await createUnit({
        country,
        // TODO: choose the heading to spawn the unit at
        heading: 0,
        isPlayerSlot: false,
        ...unitToSpawn,
      })

      await spawnGroundUnit(unit)
    })
  )
}

export async function spawnGroundUnitsInCircle(
  country: Country,
  focus: PositionLL,
  radius: number,
  units: Pick<DBUnit, 'typeName'>[]
) {
  return Promise.all(
    units.map(unit => spawnGroundUnitInCircle(country, focus, radius, unit))
  )
}

export async function spawnGroundUnitInCircle(
  country: Country,
  focus: PositionLL,
  radius: number,
  unitToSpawn: Pick<DBUnit, 'typeName'>
) {
  const position: PositionLL = {
    ...randomPositionInCircle(focus, radius),
    // use a dumb default alt of 0 here. We need to assume something,
    // but we don't really want to make a call to the game engine
    alt: 0,
  }

  const { typeName } = unitToSpawn

  const unit = await createUnit({
    country,
    // TODO: choose a heading to spawn the unit at
    heading: 0,
    isPlayerSlot: false,
    position,
    typeName,
  })

  return spawnGroundUnit(unit)
}

export async function createUnit(
  newUnit: Pick<
    Unit,
    'country' | 'heading' | 'isPlayerSlot' | 'position' | 'typeName'
  > &
    Partial<Pick<Unit, 'name'>>
): Promise<Unit> {
  const name = newUnit.name || (await uniqueUnitName())

  const unit = await insertUnit({
    ...newUnit,
    name,
  })

  return unit
}

export async function setUnitInternalCargoMass(
  unit: Unit,
  mass: number
): Promise<void> {
  const lua = `return trigger.action.setUnitInternalCargo("${unit.name}", ${mass})`

  return new Promise((resolve, reject) => {
    custom.eval({ lua }, (error, result) => {
      if (error) {
        return reject(error)
      }
      return resolve()
    })
  })
}

export async function spawnGroundUnit(unit: Unit) {
  console.log('trying to spawn ground unit')
  if (unit.isPlayerSlot) {
    throw new Error(
      'player slots can not be spawned as ground units. it breaks the game'
    )
  }
  return new Promise<{ groupName: string }>(async (resolve, reject) => {
    const { country, heading, name, position, typeName } = unit
    const groundTemplate: GroundGroupTemplate = {
      name,
      task: 'Ground Nothing', // wtf is this for? what values are available?
      position,
      units: [
        {
          position,
          name,
          type: typeName,
          heading,
          skill: Skill.SKILL_AVERAGE,
        },
      ],
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

export async function getTransform(
  unitName: string
): Promise<Required<GetTransformResponse__Output>> {
  return new Promise<Required<GetTransformResponse__Output>>(
    (resolve, reject) =>
      unit.getTransform(
        {
          name: unitName,
        },
        (error, result) => {
          if (error) {
            return reject(error)
          }

          if (!result) {
            throw new Error('missing result from getTransform call')
          }

          if (!result.heading) {
            throw new Error('missing heading from getTransform result')
          }
          if (!result.orientation) {
            throw new Error('missing orientation from getTransform result')
          }
          if (!result.position) {
            throw new Error('missing position from getTransform result')
          }
          if (!result.velocity) {
            throw new Error('missing velocity from getTransform result')
          }
          if (!result.u) {
            throw new Error('missing u from getTransform result')
          }
          if (!result.v) {
            throw new Error('missing v from getTransform result')
          }
          if (!result.time) {
            throw new Error('missing time from getTransform result')
          }

          resolve(result as Required<GetTransformResponse__Output>)
        }
      )
  )
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
        return reject(error)
      }

      if (!result || !result.json) {
        throw new Error('missing results or results json')
      }
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const [maybePosition3, maybeVelocity] = JSON.parse(result!.json!)

      const position = position3From(maybePosition3)
      const velocity = vec3From(maybeVelocity)

      resolve([position, velocity])
    })
  )
}

export function unitFrom(
  maybeUnit: Partial<
    Pick<
      Required<StreamUnitsResponse__Output>['unit'],
      'coalition' | 'groupName' | 'name' | 'position' | 'type'
    >
  > &
    Pick<Required<StreamUnitsResponse__Output>['unit'], 'playerName'>
): GameUnit {
  if (!maybeUnit) {
    throw new Error('missing unit')
  }
  const { coalition, groupName, name, playerName, position, type } = maybeUnit

  if (!coalition) {
    throw new Error('missing coalition on unit')
  }
  if (!groupName) {
    throw new Error('missing groupName on unit')
  }
  if (!name) {
    throw new Error('missing name on unit')
  }
  if (!position) {
    throw new Error('missing position on unit')
  }
  if (!type) {
    throw new Error('missing type on unit')
  }

  return {
    country: countryFrom(coalition),
    groupName,
    name,
    playerName,
    position: positionLLFrom(position),
    typeName: type,
  }
}
