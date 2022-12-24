import { StaticObjectTypeName } from '../staticObject'
import { UnitTypeName } from '../unit'
import { Template } from './types'

export const baseLevel2: Template = {
  origin: { lat: 41.852061519140165, lon: 41.797793320028276 },
  staticObjects: [
    {
      typeName: StaticObjectTypeName.FarpTent,
      bearing: 5.874126339773977,
      distance: 4.943598054028067,
      heading: 1.57079631487,
    },
    {
      typeName: StaticObjectTypeName.FarpTent,
      bearing: 185.8741263375803,
      distance: 4.943598052976492,
      heading: 1.57079631487,
    },
  ],
  slots: [],
  units: [
    {
      typeName: UnitTypeName.M818,
      bearing: 276.6411215366577,
      distance: 9.85201965394252,
      heading: -1.1368725785156e-13,
    },
    {
      typeName: UnitTypeName.M978,
      bearing: 97.51475438347217,
      distance: 10.041121490150207,
      heading: -1.1368724429898e-13,
    },
  ],
}
