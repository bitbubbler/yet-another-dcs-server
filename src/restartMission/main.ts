import { baseTemplateFrom, baseTypeDisplayNameShort } from '../base'
import { CommandType } from '../commands'
import { waitForTime } from '../common'
import { vector2DFrom } from '../coord'
import { Base, BaseType } from '../db'
import { emFork } from '../db/connection'
import { EventType, Events, MissionCommandEvent } from '../events'
import { LatLon } from '../geo'
import { HelicopterUnit, MissionShape, Miz, Point } from '../miz'
import { loadMissionFile } from '../net'
import { Restarts } from '../signals'
import { outText } from '../trigger'
import { unitTemplateFrom } from '../unit-templates'

export async function restartMissionMain(): Promise<() => Promise<void>> {
  const subscription = Events.subscribe(async event => {
    if (EventType.MissionCommand === event.type) {
      return handleMissionCommand(event)
    }
  })

  return async () => {
    subscription.unsubscribe()
  }
}

async function handleMissionCommand(event: MissionCommandEvent): Promise<void> {
  const command = event.command

  const { type } = command

  if (CommandType.RestartMission === type) {
    const { delay = 10 } = command

    const miliseconds = 1000 * delay
    const seconds = Math.floor(miliseconds / 1000)

    outText(`The mission will restart in ${seconds} seconds`)

    // Don't restart immediately, wait for a delay.
    // await waitForTimeout(miliseconds)

    const miz = new Miz()
    // Load the miz file into the class
    miz.load('./mission-templates/caucasus.miz')

    // patch the mission
    const newMission = await patchMission(await patchMission(miz.mission))

    miz.mission = newMission

    const { newMissionFilePath } = await miz.save()

    // load the new mission file
    await loadMissionFile(newMissionFilePath)

    // wait ???? why do we wait here?
    await waitForTime(1000)

    // Tell the rest of the application we restarted
    Restarts.next()
  }
}

async function patchMission(mission: MissionShape): Promise<MissionShape> {
  const em = await emFork()
  const baseRepository = em.getRepository(Base)
  // first, we set some basics

  // this allows pilots (of helis/planes) to control ground units from f10
  mission.mission.groundControl.isPilotControlVehicles = true

  // we start our group numbering here to try and ensure uniqueness
  let groupIdCounter = 10000

  // look at the bases in the db, filter down to the ones with spawn slots
  const basesWithSpawnSlots = await baseRepository.find({
    type: [BaseType.FOB, BaseType.MOB],
  })

  if (mission.mission.coalition.blue.country.length < 1) {
    mission.mission.coalition.blue.country.push({
      id: 80, // cjtf blue
      name: 'CJTF Blue',
      helicopter: {
        group: [],
      },
    })
  }

  // for each base found
  for (const base of basesWithSpawnSlots) {
    // TODO: define these in the databse
    const template = baseTemplateFrom(base)

    for (const slot of template.slots) {
      const { bearing, distance, heading, typeName } = slot
      const groupId = groupIdCounter++
      const name = `${baseTypeDisplayNameShort(base.type)} ${
        base.name
      } - ${typeName} (${groupId})`

      // find the position of the slot
      const spawnPosition = new LatLon(
        base.position.lat,
        base.position.lon
      ).destinationPoint(distance, bearing)

      // get x and y from the position
      const { x, y } = await vector2DFrom(spawnPosition)

      // clone a unit template to make a unit
      const unit: HelicopterUnit = JSON.parse(
        JSON.stringify(unitTemplateFrom(typeName))
      )

      // set the x and y on the unit
      unit.x = x
      unit.y = y

      // set the unit name (this is what players see when they select a role)
      unit.name = name

      // set the unit heading
      unit.heading = heading

      // set the unit id
      unit.unitId = groupId

      const point: Point = {
        alt: 500,
        action: 'From Ground Area Hot',
        alt_type: 'BARO',
        speed: 44.444444444444,
        task: {
          id: 'ComboTask',
          params: {
            tasks: {},
          },
        },
        type: 'TakeOffGroundHot',
        ETA: 0,
        ETA_locked: true,
        y,
        x,
        formation_template: '',
        speed_locked: true,
      }

      // update mission file with the new unit we generated from the slot
      mission.mission.coalition.blue.country[0].helicopter!.group.push({
        groupId,
        hidden: false,
        name,
        route: { points: [point] },
        task: 'CAS',
        tasks: [],
        uncontrollable: false,
        units: [unit],
        x,
        y,
      })
    }
  }

  return mission
}
