import { Entity, OneToOne, PrimaryKey, Property } from '@mikro-orm/core'
import { v4 } from 'uuid'
import { Country } from '../../__generated__/dcs/common/v0/Country'
import { BaseEntity } from './BaseEntity'
import { Position } from './Position'

export type NewStaticObject = Pick<
  StaticObject,
  'country' | 'position' | 'typeName'
>

@Entity({ tableName: 'staticObjects' })
export class StaticObject extends BaseEntity {
  @PrimaryKey()
  staticObjectId!: number

  @OneToOne({
    fieldName: 'positionId',
    unique: true,
    eager: true,
  })
  position: Position

  @Property()
  country: Country

  @Property({ type: 'integer' })
  typeName: StaticObjectTypeName

  @Property({ columnType: 'uuid' })
  uuid: string = v4()

  constructor(newStaticObject: NewStaticObject) {
    super()
    const { country, position, typeName } = newStaticObject

    this.position = position
    this.country = country
    this.typeName = typeName
  }
}

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
  SoldierM4GRG = 'Soldier M4 GRG',
  AmmoCargo = 'ammo_cargo',
  UH1HCargo = 'uh1h_cargo',
  HangerA = 'Hangar A',
  BigWhoop = 'Big Whoop',
  FlagWhite = 'White_Flag',
  FlagRed = 'Red_Flag',
  CV59NS60 = 'CV_59_NS60',
  TACANBeacon = 'TACAN_beacon',
  ISOContainer = 'iso_container',
  PatriotEPP = 'Patriot EPP',
  M818 = 'M 818',
}
