import { v4 as uuidV4 } from 'uuid'
import { PositionLL } from './common'
import { services } from './services'
import { Country } from './generated/dcs/common/v0/Country'
import { deleteStaticObject, insertStaticObject } from './db/staticObjects'

const { custom } = services

export enum StaticObjectTypeName {
  TowerCrane = 'Tower Crane',
  FarpTent = 'FARP Tent',
  CommsTowerM = 'Comms tower M',
  M1126StrykerICV = 'M1126 Stryker ICV',
  Hummer = 'Hummer',
  PatriotAMG = 'Patriot AMG',
  ContainerCargo = 'container_cargo',
  GeneratorF = 'GeneratorF',
  FarpAmmoDumpCoating = 'FARP Ammo Dump Coating',
  Windsock = 'Windsock',
  FarpFuelDepot = 'FARP Fuel Depot',
  ShelterB = 'Shelter B',
  MLRSFDDM = 'MLRS FDDM',
  House2Arm = 'house2arm',
  FBarCargo = 'f_bar_cargo',
  SoldierM4 = 'Soldier M4',
  AmmoCargo = 'ammo_cargo',
  UH1HCargo = 'uh1h_cargo',
  HangerA = 'Hangar A',
}

export type NewStaticObject = Pick<
  StaticObject,
  'country' | 'heading' | 'position' | 'typeName'
>

export interface StaticObject {
  country: Country
  heading: number
  position: Pick<PositionLL, 'lat' | 'lon'>
  staticObjectId: number
  typeName: StaticObjectTypeName
  uuid: string
}

export async function createStaticObject(
  newStaticObject: NewStaticObject
): Promise<StaticObject> {
  const uuid = uuidV4()

  const staticobject = await insertStaticObject({
    uuid,
    ...newStaticObject,
  })

  return staticobject
}

export async function despawnStaticObject(
  staticObject: StaticObject
): Promise<void> {
  const lua = `StaticObject.getByName("${staticObjectNameFrom(
    staticObject
  )}"):destroy()`
  return new Promise<void>((resolve, reject) =>
    services.custom.eval({ lua }, error => {
      if (error) {
        return reject(error)
      }

      resolve()
    })
  )
}

export async function destroyStaticObject({
  staticObjectId,
}: StaticObject): Promise<void> {
  return deleteStaticObject(staticObjectId)
}

/**
 * NOTE: sometimes this function (in game) does nothing and you have to trial and error.
 * typeName being wrong is a common reason for failure
 */
export async function spawnStaticObject(
  staticObject: StaticObject
): Promise<void> {
  const name = staticObjectNameFrom(staticObject)
  const { country, heading, position, typeName } = staticObject
  const { lat, lon } = position

  console.log('trying to spawn static', staticObject)

  const lua = `
  local vec3 = coord.LLtoLO(${lat}, ${lon}, 0)
  local staticObj = {
    ["heading"] = ${heading},
    ["type"] = "${typeName}",
    ["rate"] = 100,
    ["name"] = "${name}",
    ["y"] = vec3.z,
    ["x"] = vec3.x,
    ["dead"] = false,
    ["hidden"] = true,
  }

  return coalition.addStaticObject(${country - 1}, staticObj)
`
  return new Promise<void>(async (resolve, reject) => {
    custom.eval({ lua }, error => {
      if (error) {
        return reject(error)
      }

      resolve()
    })
  })
}

export function staticObjectNameFrom(staticObject: StaticObject): string {
  return `static-object:${staticObject.uuid}`
}
