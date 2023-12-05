import { AI } from './ai'
import * as Ticks from './ticks'

export class Game {
  private ai: AI
  private isShutdown = false
  private lastTickTime = -1
  private tickNumber = 0

  constructor({ ai }: { ai: AI }) {
    this.ai = ai
  }

  /**
   * Method to start the game instance
   */
  public start(): void {
    // prep the class state
    this.lastTickTime = now()
    // start the tick loop
    this.tickLoop()
  }

  /**
   * Method to shutdown the game instance
   */
  public shutdown(): void {
    if (this.isShutdown) {
      throw new Error('shutdown was called but game was already shutdown')
    }
    this.isShutdown = true
  }

  private async tick(): Promise<void> {
    // call component ticks here
    this.ai.tick(this.tickNumber)
  }

  private async tickLoop(): Promise<void> {
    if (this.isShutdown) {
      return
    }

    // Measure and track dropped ticks
    const tickStartTime = now()
    const elapsedLastTickTime = tickStartTime - this.lastTickTime
    const droppedTicks =
      Math.floor(elapsedLastTickTime / Ticks.TICK_RATE_MS) - 1

    // Report dropped ticks
    if (droppedTicks > 0) {
      console.warn(
        `Dropped ${droppedTicks} ticks. Previous tick (${this.tickNumber}) took: ${elapsedLastTickTime}ms`
      )
    }

    // Update lastTickTime
    this.lastTickTime = tickStartTime

    // Increment tick count
    this.tickNumber++

    // Execute the tick, catching failures to preserve the ai loop
    try {
      await this.tick()
    } catch (tickError) {
      console.error(tickError)
      console.error(`Error occured inside ai tick loop. See logs above`)
    }

    const thisTickTime = now() - tickStartTime

    setTimeout(
      () => this.tickLoop(),
      Math.max(1, Ticks.TICK_RATE_MS - thisTickTime)
    )
  }
}

function now() {
  const [seconds, nanoseconds] = process.hrtime()
  return seconds * 1000 + nanoseconds / 1e6 // Convert to milliseconds
}
