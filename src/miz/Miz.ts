import AdmZip, { IZipEntry } from 'adm-zip'
import fs from 'fs/promises'
import path from 'path'
import { options } from '../cli'
import { MemoryReader, parse, stringify, Table } from '../lua'
import { MissionShape } from './types'

/**
 * A class to allow the loading, modification, and saving of changes to a DCS miz file.
 */
export class Miz {
  private _miz?: AdmZip
  private _mission?: MissionShape

  public get mission(): MissionShape {
    if (!this._mission) {
      throw new Error('Failed to access misssion before load was called')
    }

    return this._mission
  }

  public set mission(mission: MissionShape) {
    if (!this._mission) {
      throw new Error('Failed to set misssion before load was called')
    }

    this._mission = mission
  }

  public get miz(): AdmZip {
    if (!this._miz) {
      throw new Error('Failed to access miz before load was called')
    }

    return this._miz
  }

  /**
   * A method to load a mission from a template path.
   */
  public async load(missionTemplatePath: string): Promise<void> {
    // load the miz file on disk into a buffer
    const missionTemplateBuffer = await fs.readFile(missionTemplatePath)

    // load the buffer as a zip
    this._miz = new AdmZip(missionTemplateBuffer)

    // get the zip entry for the mission file
    const missionEntry = this.miz.getEntry('mission')

    if (!missionEntry) {
      throw new Error('mission entry not found in mission template zip')
    }

    const missionTemplateMissionBuffer = await zipEntryDataFrom(missionEntry)
    // parse the mission file from the miz using our parser
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

    // WARNING: we're casting a loose type into a strict type without doing any validation here.
    // There is a chance the types don't match the runtime data.
    const mission: MissionShape = parsedMission as unknown as MissionShape

    this._mission = mission
  }

  public async save(): Promise<{
    newMissionFileName: string
    newMissionFilePath: string
  }> {
    if (!this._miz) {
      throw new Error('Failed to access miz before load was called')
    }
    // generate a filename for the mission we are about to save
    const newMissionFileName = `generated-mission-${fileTimestamp()}.miz`
    const newMissionFilePath = path.join(
      path.resolve(options.missions),
      newMissionFileName
    )

    const missionEntry = this.miz?.getEntry('mission')

    if (!missionEntry) {
      throw new Error('mission entry not found in mission template zip')
    }

    // save the patched mission to the in-memory zip entry
    missionEntry.setData(stringify(this.mission as unknown as Table))

    // save the now modified zip using the name above to the mission-tmp folder
    const newMissionFileBuffer = this._miz.toBuffer()

    // make sure the directory for mission tmp files exists
    await fs.mkdir(path.dirname(newMissionFilePath), { recursive: true })

    // write the new mission out
    await fs.writeFile(newMissionFilePath, newMissionFileBuffer)

    // return the path to the new mission
    return { newMissionFileName, newMissionFilePath }
  }
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
