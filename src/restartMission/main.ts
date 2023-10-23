import AdmZip, { IZipEntry } from 'adm-zip'
import fs from 'fs/promises'
import path from 'path'
import { CommandType } from '../commands'
import { Events, EventType, MissionCommandEvent } from '../events'
import { Restarts } from '../signals'
import { outText } from '../trigger'
import { MemoryReader, parse, stringify, Table } from '../lua'
import { Mission } from './types'
import { baseTemplateFrom, baseTypeDisplayNameShort } from '../base'
import { entityManager, orm } from '../db/connection.mjs'
import { Base, BaseType } from '../db'
import { LatLon } from '../geo'
import { vector2DFrom } from '../coord'
import { unitTemplateFrom } from '../unit-templates'
import { loadMissionFile } from '../net'
import { options } from '../cli'
import { HelicopterUnit, Point } from './types'
import { waitForTime } from '../common'

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

    // create a name for the new mission file
    const newMissionFileName = `generated-mission-${fileTimestamp()}.miz`
    const newMissionFile = path.join(
      path.resolve(options.missions),
      newMissionFileName
    )

    // Get a buffer of the zip on disk
    const missionTemplateBuffer = await fs.readFile(
      './mission-templates/caucasus.miz'
    )

    // load the mission template (zip) into memory
    const inMemoryMission = new AdmZip(missionTemplateBuffer)

    // modify the in-memory version (which is effectively now a copy) to have the spawn points from the database
    const missionEntry = inMemoryMission.getEntry('mission')

    if (!missionEntry) {
      throw new Error('mission entry not found in mission template zip')
    }

    const missionTemplateMissionBuffer = await zipEntryDataFrom(missionEntry)
    const parsedMission = await parse(
      new MemoryReader(missionTemplateMissionBuffer.toString('utf8'))
    )

    if (
      !(
        parsedMission &&
        typeof parsedMission === 'object' &&
        'mission' in parsedMission
      )
    ) {
      throw new Error('parsed mission from mission template is invalid')
    }

    // WARNING: we're casting a loos type into a strict type without doing any validation here.
    // There is a chance the types don't match the runtime data.
    const mission: Mission = parsedMission as unknown as Mission

    // patch the mission with slots for each based in the db
    const newMission = await patchMission(mission)

    // save the patched mission to the in-memory zip entry
    missionEntry.setData(stringify(newMission as unknown as Table))

    // save the now modified zip using the name above to the mission-tmp folder
    const newMissionFileBuffer = await inMemoryMission.toBuffer()

    // make sure the directory for mission tmp files exists
    await fs.mkdir(path.dirname(newMissionFile), { recursive: true })

    // write the new mission out
    await fs.writeFile(newMissionFile, newMissionFileBuffer)

    // load the new mission file
    await loadMissionFile(newMissionFileName)

    // wait ???? why do we wait here?
    await waitForTime(1000)

    // Tell the rest of the application we restarted
    Restarts.next()
  }
}

async function zipEntryDataFrom(zipEntry: IZipEntry): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    zipEntry.getDataAsync((data, err) => {
      if (err) {
        return reject(err)
      }
      return resolve(data)
    })
  })
}

function fileTimestamp(): string {
  const now = new Date()

  const day = now.getUTCDate().toString().padStart(2, '0')
  const month = (now.getUTCMonth() + 1).toString().padStart(2, '0') // add one, zero based
  const year = now.getUTCFullYear().toString().padStart(2, '0')
  const hour = now.getUTCHours().toString().padStart(2, '0')
  const minute = now.getUTCMinutes().toString().padStart(2, '0')
  const second = now.getUTCSeconds().toString().padStart(2, '0')

  return `${day}-${month}-${year}--${hour}-${minute}-${second}`
}

async function patchMission(mission: Mission): Promise<Mission> {
  const em = entityManager(await orm)

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
        groupId: groupId,
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
