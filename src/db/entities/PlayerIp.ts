import {
  Collection,
  Entity,
  ManyToOne,
  PrimaryKey,
  Property,
  Unique,
} from '@mikro-orm/core'
import { BaseEntity } from './BaseEntity'
import { Player } from './Player'

export type NewPlayerIp = Pick<PlayerIp, 'ip' | 'player'>

@Unique({ properties: ['player', 'ip'] })
@Entity({ tableName: 'playerIps' })
export class PlayerIp extends BaseEntity {
  @PrimaryKey()
  playerIpId!: number

  @ManyToOne({ fieldName: 'playerId', inversedBy: 'ips', eager: true })
  player = new Collection<Player>(this)

  @Property()
  ip: string

  constructor(newPlayerIp: NewPlayerIp) {
    super()

    const { player, ip } = newPlayerIp

    this.player = player
    this.ip = ip
  }
}
