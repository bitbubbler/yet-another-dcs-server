import { randomBetween } from './common'
import {
  //Collection,
  Entity,
  //Filter,
  //OneToOne,
  //ManyToMany,
  PrimaryKey,
  Property,
} from '@mikro-orm/core'
import { v4 } from 'uuid'

/** Frequencies Database Structure
 * Id
 * Frequency (MHz, number)
 * Modulation (AM, FM)
 * Power (W, number)
 * Loop (true, false)
 * File (.ogg file)
 */
/**
 * DCS info "C:\Program Files\Eagle Dynamics\DCS World\Doc\DCS World List of all available Beacons EN.pdf"
 */
export type NewFreq = Frequency

@Entity({ tableName: 'frequencies' })
export class Frequency {
  @PrimaryKey()
  freqId!: number

  @Property()
  frequency!: number

  @Property()
  modulation!: string

  @Property()
  power!: string

  @Property()
  loop!: boolean

  @Property()
  file!: string

  @Property({ columnType: 'uuid' })
  uuid: string = v4()

  constructor(newFreq: NewFreq) {
    const { frequency, modulation, power, loop, file } = newFreq

    this.frequency = frequency
    this.modulation = modulation
    this.power = power
    this.loop = loop
    this.file = file
  }
}

async function getFrequency() {
  /** Black list of Frequencies */
  const skipFrequencies = [
    745, //Astrahan
    381,
    384,
    300.5,
    312.5,
    1175,
    342,
    735,
    300.5,
    353.0,
    440,
    795,
    525,
    520,
    690,
    625,
    291.5,
    300.5,
    435,
    309.5,
    920,
    1065,
    274,
    312.5,
    580,
    602,
    297.5,
    750,
    485,
    950,
    214,
    1025,
    730,
    995,
    455,
    307,
    670,
    329,
    395,
    770,
    380,
    705,
    300.5,
    507,
    740,
    1030,
    515,
    330,
    309.5,
    348,
    462,
    905,
    352,
    1210,
    942,
    435,
    324,
    320,
    420,
    311,
    389,
    396,
    862,
    680,
    297.5,
    920,
    662,
    866,
    907,
    309.5,
    822,
    515,
    470,
    342,
    1182,
    309.5,
    720,
    528,
    337,
    312.5,
    830,
    740,
    309.5,
    641,
    312,
    722,
    682,
    1050,
    1116,
    935,
    1000,
    430,
    577,
  ]

  /** Generate a random Freq */
  const randomFreq = randomBetween(190, 999)

  /** Checking if randomFreq is already in the Black list */
  for (let i = 0; 1 < skipFrequencies.length; i++) {
    if ((skipFrequencies[i] = randomFreq)) {
      // if true, exit and restart
      getFrequency
    } else {
      /** if false: continue checking with freq already in db
       *  create a for loop for each entry in the table
       *  compared to random Freq
       *    if true, exit and restart
       *    if false, insert into db and return freq object
       */
    }
  }
}

async function getFreqListInDb() {
  // code to get a list of Freq in db
}

async function insertFreqInDb() {
  // code to store a new Freq in db
}

async function deleteFreqInDb() {
  // code to delete an existing Freq in db, from freqId
}

async function updateFreqInDb() {
  // could be usefull to change .ogg file and/or power
}
