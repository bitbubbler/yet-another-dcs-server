import { services } from './services'

import { PositionLL } from './common'
import { Country } from '../generated/dcs/common/v0/Country'
import { v4 as uuid } from 'uuid'

const { custom } = services

export interface SpawnFarpOptions {
  country: Country
  position: Pick<PositionLL, 'lat' | 'lon'>
  type?: 'Invisible FARP'
  name?: string
}

export async function spawnFarp({
  name: unitName,
  country,
  type = 'Invisible FARP',
  position,
}: SpawnFarpOptions) {
  console.log('trying to spawn farp')
  return new Promise<void>(async (resolve, reject) => {
    const name = unitName || (await uniqueFarpName())

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
        ["groupId"] = 32,
        ["units"] = 
        {
            [1] = 
            {
                ["category"] = "Heliports",
                ["shape_name"] = "invisiblefarp",
                ["type"] = "${type}",
                ["unitId"] = 32,
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
    custom.eval({ lua }, (error, result) => {
      debugger
      if (error) {
        return reject(error)
      }

      if (typeof result === 'undefined' || typeof result.json === 'undefined') {
        return reject(new Error('missing result or result json'))
      }

      const json = JSON.parse(result.json)

      if (typeof json.id !== 'string') {
        return reject(new Error('missing id from result json'))
      }

      resolve()
    })
  })
}

export async function uniqueFarpName(): Promise<string> {
  return uuid()
}
