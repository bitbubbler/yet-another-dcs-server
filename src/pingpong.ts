import { equal } from 'assert'
import { services } from './services'

const { custom } = services

/**
 * a pingpong function to keep the rpc stuff alive
 * @returns a function to stop the pingpong
 */
export function pingpong(): () => void {
  // send a ping and expect a ping every 5 seconds
  // if we don't get a pong assume we've disconnected
  // TODO: handle undetected disconnects
  // TODO: detect total lag experienced on disconnect using game time

  const lua = `return 'pong'`
  const interval = setInterval(() => {
    custom.eval({ lua }, (error, result) => {
      if (error) {
        stop(error)
        return
      }
      try {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        equal(JSON.parse(result!.json!), 'pong')
      } catch (error) {
        stop(error)
      }
    })
  }, 5000) // adjust this if there continue to be issues recieving events when there's a long deadtime

  function stop(error?: Error) {
    if (error) {
      console.log('pingpong error', error)
    }
    clearInterval(interval) // stop
  }

  return () => stop()
}
