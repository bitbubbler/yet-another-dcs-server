import { Coalition } from '../__generated__/dcs/common/v0/Coalition'
import { Unit } from '../db'
import { emFork } from '../db/connection'
import { EVERY_10_SECONDS, EVERY_15_SECONDS } from '../ticks'
import { UnitAgent } from './UnitAgent'
import { CaptureBaseGoal } from './goals/CaptureBaseGoal'
import { AIUnitType } from './types'
import { unitTypeActionMap } from './unitTypeActionMap'

export class AI {
  private agents: Map<Unit['unitId'], UnitAgent> = new Map()
  private creatingAndDestroying = false

  public async tick(tickNumber: number): Promise<void> {
    // Create and destroy agents based on known units
    // TODO: there is a syncronization problem between the agents that get WorldState
    //    updates and the agents created async by createDestroyAgents()
    //    We need to explicitly choose WHEN to sync the agents array with newly created agents
    // Q: Should this be handled outside of the tick loop for this reason?
    //      It does have to syncronize with the tick loop so we don't insert new agents and try to plan/execute
    //      actions on those agents without having updated their world state..
    // Idea: Maybe we should just update the world state on a new agent before we insert it into the agents array?
    if (tickNumber % EVERY_10_SECONDS === 0) {
      this.createDestroyAgents()
    }

    // Update the world state of all agents, do this concurrently
    // Block while this happens
    await Promise.all(
      Array.from(this.agents.values()).map(agent => agent.updateWorldState())
    )

    // Replan for each agent on a schedule
    if (tickNumber % EVERY_15_SECONDS === 0) {
      for (const agent of this.agents.values()) {
        agent.replan()
      }
    }

    // Execute the next action of each agent
    for (const agent of this.agents.values()) {
      agent.executeNextAction()
    }
  }

  private async createDestroyAgents(): Promise<void> {
    if (this.creatingAndDestroying) {
      return
    }

    const em = await emFork()
    const unitRepository = em.getRepository(Unit)
    const newAgents: Map<Unit['unitId'], UnitAgent> = new Map()

    const allLivingUnits = await unitRepository.find({
      isPlayerSlot: false,
      unitId: { $nin: Array.from(this.agents.keys()) },
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
        this.agents.set(unitId, agent)
      }

      // Clear the map when we're done because the agent reference will keep it in memory
      newAgents.clear()
    }

    // unlock
    this.creatingAndDestroying = false
  }
}
