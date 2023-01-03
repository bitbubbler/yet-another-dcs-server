import { _dcs_net_v0_GetPlayersResponse_GetPlayerInfo__Output as GetPlayerInfo } from './generated/dcs/net/v0/GetPlayersResponse'
import { NetServiceClient as NetService } from './generated/dcs/net/v0/NetService'
import { services } from './services'
import { options } from './cli'

const { custom, net, hook } = services

export async function getPlayers(): Promise<GetPlayerInfo[]> {
  return new Promise<GetPlayerInfo[]>((resolve, reject) => {
    net.getPlayers({}, (error, result) => {
      if (error) {
        console.log('getPlayers failed', error)
        reject(new Error('getPlayers failed'))
        return
      }
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const { players } = result!
      if (!players) {
        reject(new Error('expected to find players in result'))
        return
      }
      resolve(players)
    })
  })
}

/**
 * loadMissionFile takes only a filename and makes assumptions about where the file lives based on
 * config found in cli.ts and given at application start
 */
export async function loadMissionFile(filename: string): Promise<void> {
  const lua = `
  return net.load_mission(lfs.writedir() .. 'Missions\\\\' .. '${filename}')
`

  return new Promise((resolve, reject) => {
    hook.eval({ lua }, (error, result) => {
      if (error) {
        return reject(error)
      }

      if (typeof result === 'undefined' || typeof result.json === 'undefined') {
        return reject(new Error('missing result or result json'))
      }

      const json = JSON.parse(result.json)

      return resolve(json)
    })
  })
}
