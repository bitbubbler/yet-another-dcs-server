import {
  _dcs_coalition_v0_AddGroupRequest_GroundGroupTemplate as GroundGroupTemplate,
  _dcs_coalition_v0_AddGroupRequest_Skill as Skill,
} from './__generated__/dcs/coalition/v0/AddGroupRequest'
import { Coalition } from './__generated__/dcs/common/v0/Coalition'
import { Country } from './__generated__/dcs/common/v0/Country'
import { GroupCategory } from './__generated__/dcs/common/v0/GroupCategory'

import { metersToDegree, randomPositionInCircle } from './common'
import { distanceFrom } from './convert'
import { NewUnit, Unit } from './db'
import { emFork } from './db/connection'
import { services } from './services'
import { GamePositionLL } from './types'

const { coalition, custom } = services

export interface PlayerUnit extends Unit {
  isPlayerSlot: true
}

export function isPlayerUnit(unit: Unit): unit is PlayerUnit {
  return unit.isPlayerSlot === true
}

interface CreateGroundUnitOptions {
  country: Country
  focus: GamePositionLL
  hidden: boolean
  radius: number
  unit: Pick<Unit, 'typeName'> & Pick<Unit, 'heading'>
}

interface CreateGroundUnitsOptions
  extends Omit<CreateGroundUnitOptions, 'unit'> {
  country: Country
  focus: GamePositionLL
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

  const position: GamePositionLL = {
    ...randomPositionInCircle(focus, radius),
    alt: 0,
  }

  return createGroundUnit({
    country,
    heading,
    hidden,
    isPlayerSlot: false,
    position,
    typeName,
  })
}

export async function createGroundUnit(
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
  const { country, heading, hidden, name, typeName } = unit

  console.log(`attempting to spawn gruondUnit of type ${typeName}`)

  if (unit.isPlayerSlot) {
    throw new Error(
      'player slots can not be spawned as ground units. it breaks the game'
    )
  }

  return new Promise(async (resolve, reject) => {
    const { lat, lon, alt } = unit.position
    const position: GamePositionLL = { lat, lon, alt }

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

export async function getPositionLL(unitName: string): Promise<GamePositionLL> {
  const lua = `
    local unit = Unit.getByName("${unitName}")
    local position = unit:getPosition()

    loal lat, lon, alt = coord.LOtoLL(position.p)

    return { lat = lat, lon = lon, alt = alt }
`

  return new Promise<GamePositionLL>((resolve, reject) =>
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

export async function findNearbyUnits({
  position,
  accuracy,
  coalition,
}: {
  position: Pick<GamePositionLL, 'lat' | 'lon'>
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
