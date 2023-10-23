import { PositionLL } from './common'
import { NewPlayer, Player } from './db'
import { entityManager, orm } from './db/connection.mjs'
import { services } from './services'

/**
 * The player as represented by the game. Typically recieved from dcs-grpc or lua calls.
 */
export type GamePlayer = Pick<Player, 'ucid'> & {
  position: PositionLL
  playerName: string
}

export type NetPlayer = Pick<Player, 'name' | 'ucid'>

const { hook } = services

export async function createPlayer(newPlayer: NewPlayer): Promise<Player> {
  const em = entityManager(await orm)

  const player = new Player(newPlayer)

  await em.persistAndFlush(player)

  return player
}

export async function netPlayerFrom(playerName: string): Promise<NetPlayer> {
  const gamePlayers = await allNetPlayers()

  const nameMatchingGamePlayers = gamePlayers.filter(
    player => player.name === playerName
  )

  if (nameMatchingGamePlayers.length < 1) {
    throw new Error(`Player with the name '${playerName}' was not found`)
  }
  if (nameMatchingGamePlayers.length > 1) {
    // TODO: kick both players when we find clashing names
    throw new Error(
      `Multiple players exist with the same name: '${playerName}'`
    )
  }

  // expect that array has exactly one item
  const gamePlayer = gamePlayers[0]

  return gamePlayer
}

export async function allNetPlayers(): Promise<NetPlayer[]> {
  const lua = `

  local players = {}

  for _, playerId in ipairs(net.get_player_list()) do
    table.insert(players, net.get_player_info(playerId))
  end

  return players
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

      return resolve(json as NetPlayer[])
    })
  })
}
