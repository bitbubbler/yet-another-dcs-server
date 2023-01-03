import { services } from './services'

import { PositionLL } from './common'
import { Country } from './generated/dcs/common/v0/Country'

const { custom } = services

export interface SpawnFarpOptions {
  name: string
  country: Country
  groupId: number
  position: Pick<PositionLL, 'lat' | 'lon'>
  type: 'Invisible FARP'
}

export async function spawnFarp({
  name,
  groupId,
  country,
  position,
  type,
}: SpawnFarpOptions): Promise<void> {
  return new Promise(function (resolve, reject) {
    const lua = `
    local pos = coord.LLtoLO(${position.lat}, ${position.lon})
    local template ={
      ["heading"] = 0,
      ["route"] = 
      {
          ["points"] = 
          {
              [1] = 
              {
                  ["alt"] = 0,
                  ["type"] = "",
                  ["name"] = "",
                  ["y"] = pos.z,
                  ["speed"] = 0,
                  ["x"] = pos.x,
                  ["formation_template"] = "",
                  ["action"] = "",
              }, -- end of [1]
          }, -- end of ["points"]
      }, -- end of ["route"]
      ["groupId"] = ${groupId},
      ["units"] = 
      {
          [1] = 
          {
              ["category"] = "Heliports",
              ["shape_name"] = "invisiblefarp",
              ["type"] = "${type}",
              ["unitId"] = ${groupId},
              ["heliport_callsign_id"] = 1,
              ["heliport_modulation"] = 0,
              ["rate"] = 100,
              ["y"] = pos.z,
              ["x"] = pos.x,
              ["name"] = "${name}",
              ["heliport_frequency"] = "127.5",
              ["heading"] = 0,
          }, -- end of [1]
      }, -- end of ["units"]
      ["y"] = pos.z,
      ["x"] = pos.x,
      ["name"] = "${name}",
      ["dead"] = false,
  }
    return coalition.addGroup(${country - 1}, -1, template)
    `
    custom.eval({ lua: lua }, function (error, result) {
      if (error) {
        return reject(error)
      }
      if (typeof result === 'undefined' || typeof result.json === 'undefined') {
        return reject(new Error('missing result or result json'))
      }
      const json = JSON.parse(result.json)
      if (typeof json.id_ !== 'number') {
        return reject(new Error('missing id from result json'))
      }
      return resolve()
    })
  })
}

export async function despawnFarp(): Promise<void> {
  // TODO: implement
}
