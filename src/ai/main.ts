import { Coalition } from '../__generated__/dcs/common/v0/Coalition'
import { Unit } from '../db'
import { emFork } from '../db/connection'
import { UnitAgent } from './UnitAgent'
import { CaptureBaseGoal } from './goals/CaptureBaseGoal'
import * as Ticks from './ticks'
import { AIUnitType } from './types'
import { unitTypeActionMap } from './unitTypeActionMap'

export async function aiMain(): Promise<() => Promise<void>> {
  let stop = false
  let lastTickTime = now()
  let tickCounter = 0

  const em = await emFork()
  const agents: Map<Unit['unitId'], UnitAgent> = new Map()

  let creatingAndDestroying = false

  async function createDestroyAgents(): Promise<void> {
    // crude lock
    if (creatingAndDestroying) {
      return
    }
    creatingAndDestroying = true

    const unitRepository = em.getRepository(Unit)
    const newAgents: Map<Unit['unitId'], UnitAgent> = new Map()

    const allLivingUnits = await unitRepository.find({
      isPlayerSlot: false,
      unitId: { $nin: Array.from(agents.keys()) },
    })

    for (const unit of allLivingUnits) {
      const { coalition, name, position, typeName, unitId } = unit

      if (
        coalition === Coalition.COALITION_ALL ||
        coalition === Coalition.COALITION_NEUTRAL
      ) {
        console.warn(
          `Excluding unit ${unitId} from ai due to unexpected coalition ${coalition}.`
        )
        continue
      }

      // Lookup a generateActions impl for this unit using the typeName
      const generateActions = unitTypeActionMap[AIUnitType.HMMWV]

      if (!generateActions) {
        console.warn(
          `Excluding unit ${unitId} with type ${typeName} from ai due to missing generateActions.`
        )
        continue
      }

      // Create a new agent for this unit
      const agent = new UnitAgent({
        coalition,
        generateActions,
        goals: [new CaptureBaseGoal()],
        groupName: name,
        position,
        unitId,
      })
      newAgents.set(unitId, agent)
    }

    if (newAgents.size > 0) {
      // Update the world state for all the new agents before we add them to the runtime
      await Promise.all(
        Array.from(newAgents.values()).map(agent => agent.updateWorldState())
      )

      // Push the new agents into the runtime so they get ticked
      for (const [unitId, agent] of newAgents) {
        agents.set(unitId, agent)
      }

      // Clear the map when we're done because the agent reference will keep it in memory
      newAgents.clear()
    }

    // unlock
    creatingAndDestroying = false
  }

  /**
   * This tick function is async, to support the way we are forced to build WorldState
   *
   * ONLY `updateWorldState` should actually be blocking in this tick function
   */
  async function tick() {
    // Create and destroy agents based on known units
    // TODO: there is a syncronization problem between the agents that get WorldState
    //    updates and the agents created async by createDestroyAgents()
    //    We need to explicitly choose WHEN to sync the agents array with newly created agents
    // Q: Should this be handled outside of the tick loop for this reason?
    //      It does have to syncronize with the tick loop so we don't insert new agents and try to plan/execute
    //      actions on those agents without having updated their world state..
    // Idea: Maybe we should just update the world state on a new agent before we insert it into the agents array?
    if (tickCounter % Ticks.EVERY_10_SECONDS === 0) {
      createDestroyAgents()
    }

    // Update the world state of all agents, do this concurrently
    // Block while this happens
    await Promise.all(
      Array.from(agents.values()).map(agent => agent.updateWorldState())
    )

    // Replan for each agent on a schedule
    if (tickCounter % Ticks.EVERY_15_SECONDS === 0) {
      for (const agent of agents.values()) {
        agent.replan()
      }
    }

    // Execute the next action of each agent
    for (const agent of agents.values()) {
      agent.executeNextAction()
    }
  }

  async function aiLoop() {
    if (stop) {
      return
    }

    // Measure and track dropped ticks
    const tickStartTime = now()
    const elapsedLastTickTime = tickStartTime - lastTickTime
    const droppedTicks =
      Math.floor(elapsedLastTickTime / Ticks.TICK_RATE_MS) - 1

    // Report dropped ticks
    if (droppedTicks > 0) {
      console.warn(
        `Dropped ${droppedTicks} ticks. Previous tick (${tickCounter}) took: ${elapsedLastTickTime}ms`
      )
    }

    // Update lastTickTime
    lastTickTime = tickStartTime

    // Increment tick count
    tickCounter++

    // Execute the tick, catching failures to preserve the ai loop
    try {
      await tick()
    } catch (tickError) {
      console.error(tickError)
      console.error(`Error occured inside ai tick loop. See logs above`)
    }

    const thisTickTime = now() - tickStartTime

    setTimeout(() => aiLoop(), Math.max(1, Ticks.TICK_RATE_MS - thisTickTime))
  }

  aiLoop()

  return Promise.resolve(async () => {
    // TODO: Halt planners that are currently planning
    stop = true
  })
}

function now() {
  const [seconds, nanoseconds] = process.hrtime()
  return seconds * 1000 + nanoseconds / 1e6 // Convert to milliseconds
}
