export interface Mission {
  mission: {
    coalition: {
      neutrals: Coalition
      blue: Coalition
      red: Coalition
    }
  }
}

export interface Coalition {
  bullseye: {
    x: number
    y: number
  }
  country: CoalitionCountry[]
}

export interface CoalitionCountry {
  id: number
  name: string
  helicopter: {
    group: HelicopterGroup[]
  }
}

export type HelicopterGroup = Group<HelicopterUnit>

export interface Group<TUnitShape> {
  groupId: number
  name: string
  uncontrollable: false
  hidden: boolean
  route: {
    points: Point[]
  }
  task: 'CAS'
  tasks: Record<never, never>
  units: TUnitShape[]
  x: number
  y: number
}

export type HelicopterUnit = Unit

export interface Unit {
  alt: number
  alt_type: 'BARO'
  livery_id: string
  skill: 'Client'
  speed: number
  type: string
  unitId: number
  y: number
  x: number
  name: string
  payload: {
    fuel: string
    flare: number
    chaff: number
    gun: number
    ammo_type: number
  }
  heading: number
  callsign: {
    1: number
    2: number
    3: number
    name: string
  }
  onboard_num: string
}

export interface Point {
  alt: number
  alt_type: 'BARO'
  action: 'From Parking Area Hot' | 'From Ground Area'
  speed: number
  task: {
    id: 'ComboTask'
    params: {
      tasks: Record<never, never>
    }
  }
  type: 'TakeOffParkingHot' | 'TakeOffGround'
  ETA: 0
  ETA_locked: true
  formation_template: ''
  speed_locked: true
  x: number
  y: number
}
