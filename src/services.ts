// this file contains a singleton of our grpc services

import * as path from 'path'
import * as grpc from '@grpc/grpc-js'
import * as protoLoader from '@grpc/proto-loader'

import { CoalitionServiceClient as CoalitionService } from './__generated__/dcs/coalition/v0/CoalitionService'
import { GroupServiceClient as GroupService } from './__generated__/dcs/group/v0/GroupService'
import { HookServiceClient as HookService } from './__generated__/dcs/hook/v0/HookService'
import { MissionServiceClient as MissionService } from './__generated__/dcs/mission/v0/MissionService'
import { NetServiceClient as NetService } from './__generated__/dcs/net/v0/NetService'
import { TriggerServiceClient as TriggerService } from './__generated__/dcs/trigger/v0/TriggerService'
import { UnitServiceClient as UnitService } from './__generated__/dcs/unit/v0/UnitService'
import { WorldServiceClient as WorldService } from './__generated__/dcs/world/v0/WorldService'
import { CustomServiceClient as CustomService } from './__generated__/dcs/custom/v0/CustomService'
import { ProtoGrpcType } from './__generated__/dcs'
import { options } from './cli'

export interface Services {
  readonly coalition: CoalitionService
  readonly custom: CustomService
  readonly group: GroupService
  readonly hook: HookService
  readonly mission: MissionService
  readonly net: NetService
  readonly trigger: TriggerService
  readonly unit: UnitService
  readonly world: WorldService
}

export const address = options.address

const PROTO_PATH = path.resolve(
  path.join(__dirname, 'proto', 'dcs', 'dcs.proto')
)

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  includeDirs: [path.resolve(path.join(__dirname, 'proto'))],
})
const proto = grpc.loadPackageDefinition(
  packageDefinition
) as unknown as ProtoGrpcType

const coalition = new proto.dcs.coalition.v0.CoalitionService(
  address,
  grpc.credentials.createInsecure()
)
const custom = new proto.dcs.custom.v0.CustomService(
  address,
  grpc.credentials.createInsecure()
)
const group = new proto.dcs.group.v0.GroupService(
  address,
  grpc.credentials.createInsecure()
)
const hook = new proto.dcs.hook.v0.HookService(
  address,
  grpc.credentials.createInsecure()
)
const mission = new proto.dcs.mission.v0.MissionService(
  address,
  grpc.credentials.createInsecure()
)
const net = new proto.dcs.net.v0.NetService(
  address,
  grpc.credentials.createInsecure()
)
const trigger = new proto.dcs.trigger.v0.TriggerService(
  address,
  grpc.credentials.createInsecure()
)
const unit = new proto.dcs.unit.v0.UnitService(
  address,
  grpc.credentials.createInsecure()
)
const world = new proto.dcs.world.v0.WorldService(
  address,
  grpc.credentials.createInsecure()
)

export const services = {
  coalition,
  custom,
  group,
  hook,
  mission,
  net,
  trigger,
  unit,
  world,
  ready(): Promise<void[]> {
    const readyDeadline = Date.now() + 1000 * 3

    console.log(`connecting to ${address}`)

    return Promise.all([
      waitForReady(coalition, readyDeadline),
      waitForReady(group, readyDeadline),
      waitForReady(hook, readyDeadline),
      waitForReady(mission, readyDeadline),
      waitForReady(net, readyDeadline),
      waitForReady(trigger, readyDeadline),
      waitForReady(unit, readyDeadline),
      waitForReady(world, readyDeadline),
    ]).then(result => {
      console.log('connected')

      return result
    })
  },
}

function waitForReady(
  service: grpc.Client,
  deadline: grpc.Deadline
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    service.waitForReady(deadline, error => {
      if (error) {
        return reject(error)
      }
      return resolve()
    })
  })
}
