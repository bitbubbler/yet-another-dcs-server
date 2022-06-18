import { _dcs_net_v0_GetPlayersResponse_GetPlayerInfo__Output as GetPlayerInfo } from '../generated/dcs/net/v0/GetPlayersResponse'
import { NetServiceClient as NetService } from '../generated/dcs/net/v0/NetService'

interface DI {
  netService: NetService
}

export async function getPlayers(di: DI): Promise<GetPlayerInfo[]> {
  const { netService } = di
  return new Promise<GetPlayerInfo[]>((resolve, reject) => {
    netService.getPlayers({}, (error, result) => {
      if (error) {
        console.log('getPlayers failed', error)
        throw new Error('getPlayers failed')
      }
      const { players } = result!
      if (!players) {
        throw new Error('expected to find players in result')
      }
      resolve(players)
    })
  })
}
