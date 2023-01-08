import { services } from './services'
import { NewStaticObject, StaticObject } from './db'
import { entityManager, orm } from './db'

const { custom } = services

export async function createStaticObject(
  newStaticObject: NewStaticObject
): Promise<StaticObject> {
  const staticObject = new StaticObject(newStaticObject)

  await entityManager(await orm)
    .getRepository(StaticObject)
    .persist(staticObject)
    .flush()

  return staticObject
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

export async function destroyStaticObject(
  staticObject: StaticObject
): Promise<void> {
  await entityManager(await orm)
    .remove(staticObject)
    .flush()
}

/**
 * NOTE: sometimes this function (in game) does nothing and you have to trial and error.
 * typeName being wrong is a common reason for failure
 */
export async function spawnStaticObject(
  staticObject: StaticObject
): Promise<void> {
  const name = staticObjectNameFrom(staticObject)
  const { country, position, typeName } = staticObject
  const { lat, lon, heading } = position

  console.log(`attempting to spawn staticObject of type ${typeName}`)

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
