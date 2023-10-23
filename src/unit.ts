import { services } from './services'

import {
  _dcs_coalition_v0_AddGroupRequest_GroundGroupTemplate as GroundGroupTemplate,
  _dcs_coalition_v0_AddGroupRequest_Skill as Skill,
} from './__generated__/dcs/coalition/v0/AddGroupRequest'
import { Country } from './__generated__/dcs/common/v0/Country'
import { GroupCategory } from './__generated__/dcs/common/v0/GroupCategory'
import { StreamUnitsResponse__Output } from './__generated__/dcs/mission/v0/StreamUnitsResponse'
import {
  distanceFrom,
  metersToDegree,
  position3From,
  positionLLFrom,
  randomPositionInCircle,
  vec3From,
} from './common'
import { Position3, PositionLL, Velocity } from './common'
import { emFork, orm } from './db/connection'
import { NewUnit, Position, Unit, UnitTypeName } from './db'
import { GetTransformResponse__Output } from './__generated__/dcs/unit/v0/GetTransformResponse'
import { countryFrom } from './country'
import { createPosition } from './position'
import { Coalition } from './__generated__/dcs/common/v0/Coalition'

const { coalition, custom, unit } = services

/**
 * The unit as represented by the game. Typically recieved from dcs-grpc or lua calls.
 *
 * NOTE: The `heading` returned by dcs-grpc is currently not the users real heading.
 * https://github.com/DCS-gRPC/rust-server/issues/159
 */
export type GameUnit = Pick<Unit, 'country' | 'name' | 'typeName'> & {
  position: PositionLL
  heading: number
  groupName: string
  playerName: string | undefined
}

export interface PlayerUnit extends Unit {
  isPlayerSlot: true
}

export function isPlayerUnit(unit: Unit): unit is PlayerUnit {
  return unit.isPlayerSlot === true
}

interface CreateGroundUnitOptions {
  country: Country
  focus: PositionLL
  hidden: boolean
  radius: number
  unit: Pick<Unit, 'typeName'> & Pick<Position, 'heading'>
}

interface CreateGroundUnitsOptions
  extends Omit<CreateGroundUnitOptions, 'unit'> {
  country: Country
  focus: PositionLL
  hidden: boolean
  radius: number
  units: CreateGroundUnitOptions['unit'][]
}

export async function createGroundUnitsInCircle({
  country,
  focus,
  hidden,
  radius,
  units,
}: CreateGroundUnitsOptions): Promise<Unit[]> {
  return Promise.all(
    units.map(unit =>
      createGroundUnitInCircle({ country, focus, hidden, radius, unit })
    )
  )
}

export async function createGroundUnitInCircle({
  country,
  focus,
  hidden,
  radius,
  unit: newUnit,
}: CreateGroundUnitOptions): Promise<Unit> {
  const { heading, typeName } = newUnit

  const position = await createPosition({
    ...randomPositionInCircle(focus, radius),
    alt: 0,
    heading,
  })

  return createUnit({
    country,
    position,
    hidden,
    isPlayerSlot: false,
    typeName,
  })
}

export async function createUnit(
  newUnit: Omit<NewUnit, 'name'> & Partial<Pick<NewUnit, 'name'>>
): Promise<Unit> {
  const name = newUnit.name || (await uniqueUnitName())

  const unit = new Unit({ ...newUnit, name })

  const em = await emFork()

  await em.persistAndFlush(unit)

  return unit
}

export async function unitInAir(unit: Unit): Promise<boolean> {
  const lua = `
  local unit = Unit.getByName("${unit.name}")
  
  if unit == nil then
    return nil
  end

  return unit:inAir()
`

  return new Promise((resolve, reject) => {
    custom.eval({ lua }, (error, result) => {
      if (error) {
        return reject(error)
      }
      if (!result || !result.json) {
        return reject(Error('missing json from result'))
      }

      const inAir = JSON.parse(result.json) as boolean

      return resolve(inAir)
    })
  })
}

export async function setUnitInternalCargoMass(
  unit: Unit,
  mass: number
): Promise<void> {
  const lua = `return trigger.action.setUnitInternalCargo("${unit.name}", ${mass})`

  return new Promise((resolve, reject) => {
    custom.eval({ lua }, error => {
      if (error) {
        return reject(error)
      }
      return resolve()
    })
  })
}

export async function spawnGroundUnit(
  unit: Unit
): Promise<{ groupName: string }> {
  const { country, hidden, name, typeName } = unit

  console.log(`attempting to spawn gruondUnit of type ${typeName}`)

  if (unit.isPlayerSlot) {
    throw new Error(
      'player slots can not be spawned as ground units. it breaks the game'
    )
  }

  return new Promise(async (resolve, reject) => {
    if (!unit.position) {
      debugger
    }
    const { heading, lat, lon, alt } = unit.position
    const position: PositionLL = { lat, lon, alt }

    const groundTemplate: GroundGroupTemplate = {
      name,
      task: 'Ground Nothing', // wtf is this for? what values are available?
      position,
      hidden,
      visible: hidden,
      uncontrollable: false,
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
  const em = await emFork()
  const unitRepository = em.getRepository(Unit)

  const id = Math.floor(1000 + Math.random() * 9000)

  const name = `spawned unit ${id}`

  // check that the name is not already in use
  const existingUnit = await unitRepository.findOne({ name })

  // if the name is alredy in use
  if (existingUnit) {
    // try again
    return uniqueUnitName()
  }

  // otherwise return this name
  return name
}

export async function despawnGroundUnit({
  name,
}: Pick<Unit, 'name'>): Promise<void> {
  const lua = `
  local unit = Unit.getByName("${name}")

  if unit == nil then
    return nil
  end
  
  return unit:destroy()`
  return new Promise<void>((resolve, reject) =>
    services.custom.eval({ lua }, error => {
      if (error) {
        return reject(error)
      }

      resolve()
    })
  )
}

export async function getPositionLL(unitName: string): Promise<PositionLL> {
  const lua = `
    local unit = Unit.getByName("${unitName}")
    local position = unit:getPosition()

    loal lat, lon, alt = coord.LOtoLL(position.p)

    return { lat = lat, lon = lon, alt = alt }
`

  return new Promise<PositionLL>((resolve, reject) =>
    services.custom.eval({ lua }, (error, result) => {
      if (error) {
        return reject(error)
      }

      if (!result || !result.json) {
        throw new Error('missing results or results json')
      }

      resolve(JSON.parse(result.json))
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

export async function findNearbyUnits({
  position,
  accuracy,
  coalition,
}: {
  position: Pick<Position, 'lat' | 'lon'>
  accuracy: number
  coalition: Coalition
}): Promise<Unit[]> {
  const em = await emFork()

  const unitRepository = em.getRepository(Unit)

  const { lat, lon } = position

  let query = unitRepository
    .createQueryBuilder()
    .select('*')
    .where({
      $and: [
        { position: { lat: { $gte: lat - metersToDegree(accuracy) } } },
        { position: { lat: { $lte: lat + metersToDegree(accuracy) } } },
        { position: { lon: { $gte: lon - metersToDegree(accuracy) } } },
        { position: { lon: { $lte: lon + metersToDegree(accuracy) } } },
      ],
    })

  // if not all, search by coalition
  if (Coalition.COALITION_ALL !== coalition) {
    query = query.andWhere({ coalition })
  }

  const nearby = await query

  return nearby
    .map(unit => {
      return { unit, distance: distanceFrom(position, unit.position) }
    })
    .filter(unit => unit.distance <= accuracy)
    .sort((a, b) => a.distance - b.distance)
    .map(unit => unit.unit)
}

export function gameUnitFrom(
  maybeUnit: Partial<
    Pick<
      Required<StreamUnitsResponse__Output>['unit'],
      'coalition' | 'groupName' | 'heading' | 'name' | 'position' | 'type'
    >
  > &
    Pick<Required<StreamUnitsResponse__Output>['unit'], 'playerName'>
): GameUnit {
  if (!maybeUnit) {
    throw new Error('missing unit')
  }
  const { coalition, groupName, heading, name, playerName, position, type } =
    maybeUnit

  if (!coalition) {
    throw new Error('missing coalition on unit')
  }
  if (typeof heading !== 'number') {
    throw new Error('missing heading on unit')
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
    heading,
    name,
    playerName,
    position: positionLLFrom(position),
    typeName: type as UnitTypeName,
  }
}

export async function unitIsAlive(unit: Unit): Promise<boolean> {
  const lua = `
  local unit = Unit.getByName("${unit.name}")
  
  if unit == nil then
    return false
  end

  return true
`

  return new Promise((resolve, reject) => {
    custom.eval({ lua }, (error, result) => {
      if (error) {
        return reject(error)
      }
      if (!result || !result.json) {
        return reject(Error('missing json from result'))
      }

      const isAlive = JSON.parse(result.json) as boolean

      return resolve(isAlive)
    })
  })
}
