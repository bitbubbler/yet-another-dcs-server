import { services } from '../services'
import { baseLevel3 } from '../templates'
import { spawnStaticObject } from '../staticObject'
import { countryFrom } from '../country'
import { Coalition } from '../../generated/dcs/common/v0/Coalition'
import { randomBetween } from '../common'
import { LatLon } from '../geo'

async function main(): Promise<void> {
  await services.ready()

  const { origin, staticObjects, units } = baseLevel3

  for (const staticObject of staticObjects) {
    const { typeName, bearing, distance, heading } = staticObject
    const { lat, lon } = new LatLon(origin.lat, origin.lon).destinationPoint(
      distance,
      bearing
    )
    const position = { lat, lon }

    await spawnStaticObject({
      countryId: countryFrom(Coalition.COALITION_RED),
      name: 'static object ' + randomBetween(1, 100),
      type: typeName,
      position,
      heading,
    })
  }
}

main().catch(error => {
  console.log('big bad', error)
})

process.on('uncaughtException', function (err) {
  console.log(err)
})
