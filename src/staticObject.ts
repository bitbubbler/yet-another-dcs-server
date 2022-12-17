import { v4 as uuidV4 } from 'uuid'
import { PositionLL } from './common'
import { services } from './services'
import { Country } from '../generated/dcs/common/v0/Country'
import { insertStaticObject } from './db/staticObjects'

const { custom } = services

export enum StaticObjectTypeName {
  TowerCrane = 'Tower Crane',
  FarpTent = 'FARP Tent',
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
  }

  return coalition.addStaticObject(${country}, staticObj)
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
