import { countryFrom } from './country'
import {
  CargoSuperType,
  CargoTypeName,
  Csar,
  NewCsar,
  Position,
  StaticObject,
  StaticObjectTypeName,
  Unit,
  UnitTypeName,
} from './db'
import { emFork } from './db/connection'
import { outCoalitionText, outGroupText, smoke } from './trigger'
import { despawnGroundUnit, spawnGroundUnit } from './unit'
import { distanceFrom, metersToDegree, SmokeColor, waitForTime } from './common'
import { despawnStaticObject, spawnStaticObject } from './staticObject'
import { Coalition } from './__generated__/dcs/common/v0/Coalition'
import { QBFilterQuery, wrap } from '@mikro-orm/core'
import { createCsarCargo, loadCargo } from './cargo'
import { Group } from './group'
import { coalitionFrom } from './coalition'

export async function createCsar(
  newCsar: Omit<NewCsar, 'marker' | 'unit'>
): Promise<Csar> {
  const em = await emFork()
  const { coalition, diedUnit, player, position } = newCsar
  const country = countryFrom(coalition)

  const marker = new StaticObject({
    country,
    position,
    typeName: StaticObjectTypeName.FlagWhite,
  })

  // create a soldier unit to act as a visual csar unit for pickup/smoke
  const unit = new Unit({
    country,
    hidden: true,
    isPlayerSlot: false,
    position,
    canRespawn: false,
    name: `CSAR ${player.name} of ${diedUnit.name} ${new Date().toISOString()}`,
    typeName: UnitTypeName.InfantryM4,
  })

  const csar = new Csar({ ...newCsar, marker, unit })

  await em.persistAndFlush(csar)

  return csar
}

export async function spawnCsar(csar: Csar): Promise<void> {
  const promises: Promise<any>[] = []

  if (csar.marker) {
    await wrap(csar.marker).init()
    promises.push(spawnStaticObject(csar.marker))
  }
  if (csar.unit) {
    await wrap(csar.unit).init()
    promises.push(spawnGroundUnit(csar.unit))
  }

  await Promise.all(promises)
}

export async function despawnCsar(csar: Csar): Promise<void> {
  const promises: Promise<any>[] = []

  if (csar.marker) {
    await wrap(csar.marker).init()
    promises.push(despawnStaticObject(csar.marker))
  }
  if (csar.unit) {
    await wrap(csar.unit).init()
    promises.push(despawnGroundUnit(csar.unit))
  }

  await Promise.all(promises)
}

export async function pickupCsar(group: Group, unit: Unit, csar: Csar) {
  const em = await emFork()
  // create a new cargo out of the csar
  const cargo = await createCsarCargo({
    csar,
    displayName: `Downed Pilot ${csar.player.name} of ${csar.diedUnit.name}`,
    internal: true,
    mass: 0,
    position: unit.position,
    superType: CargoSuperType.Csar,
    typeName: CargoTypeName.UH1HCargo,
  })

  // load the cargo in the unit
  await loadCargo(unit, cargo)

  // mark the csar as pickedUp
  csar.pickedUp()

  // despawn the csar
  await despawnCsar(csar)

  // destroy the csar unit and marker
  if (csar.unit) {
    em.remove(csar.unit)
  }
  if (csar.marker) {
    em.remove(csar.marker)
  }

  // make sure changes to the csar get persisted
  em.persist(csar)

  // flush all of our changes
  await em.flush()

  // announce to the pilot immediately
  await outGroupText(
    group.id,
    `Downed Pilot ${csar.player.name}: I'm in! Get me to the MASH!`
  )

  // wait for a few seconds before we announce to everyone
  await waitForTime(5000)

  // announce to everyone
  await outCoalitionText(
    coalitionFrom(unit.country),
    `Downed pilot ${csar.player.name} has been picked up by ${unit.name}`
  )
}

export async function smokeCsar(csar: Csar): Promise<void> {
  await smoke(csar.position, SmokeColor.SMOKE_COLOR_BLUE)
}

export async function allCsars(): Promise<Csar[]> {
  const em = await emFork()
  const csarRepository = em.getRepository(Csar)

  const csars = await csarRepository.findAll()

  return csars
}

export async function findNearbyCsars({
  position,
  accuracy,
  coalition,
  where,
}: {
  position: Pick<Position, 'lat' | 'lon'>
  accuracy: number
  coalition: Coalition
  where?: QBFilterQuery<Csar>
}): Promise<Csar[]> {
  const em = await emFork()
  const csarRepository = em.getRepository(Csar)

  const { lat, lon } = position

  let query = csarRepository
    .createQueryBuilder('b')
    .select('*')
    .leftJoinAndSelect('b.position', 'po')
    .leftJoinAndSelect('b.player', 'pl')
    .leftJoinAndSelect('b.unit', 'u')
    .leftJoinAndSelect('u.position', 'up')
    .leftJoinAndSelect('b.diedUnit', 'du')
    .where({
      $and: [
        { position: { lat: { $gte: lat - metersToDegree(accuracy) } } },
        { position: { lat: { $lte: lat + metersToDegree(accuracy) } } },
        { position: { lon: { $gte: lon - metersToDegree(accuracy) } } },
        { position: { lon: { $lte: lon + metersToDegree(accuracy) } } },
        {
          goneAt: { $exists: false },
          pickedUpAt: { $exists: false },
          rescuedAt: { $exists: false },
        },
      ],
    })

  // if not all, search by coalition
  if (Coalition.COALITION_ALL !== coalition) {
    query = query.andWhere({ coalition })
  }

  if (where) {
    query = query.andWhere(where)
  }

  const nearby = await query.getResultList()

  // initialize the returned
  return nearby
    .map(csar => {
      return { csar, distance: distanceFrom(position, csar.position) }
    })
    .filter(csar => csar.distance <= accuracy)
    .sort((a, b) => a.distance - b.distance)
    .map(csar => csar.csar)
}
