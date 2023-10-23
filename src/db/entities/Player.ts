import {
  Collection,
  Entity,
  Index,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryKey,
  Property,
  Ref,
  Unique,
} from '@mikro-orm/core'
import { Position } from './Position'
import { BaseEntity } from './BaseEntity'
import { Unit } from './Unit'
import { Csar } from './Csar'
import { PlayerIp } from './PlayerIp'

export type NewPlayer = Pick<Player, 'name' | 'ucid'>

@Entity({ tableName: 'players' })
export class Player extends BaseEntity {
  @PrimaryKey()
  playerId!: number

  @OneToMany({ mappedBy: 'player' })
  csars = new Collection<Ref<Csar>>(this)

  @OneToMany({ mappedBy: 'player' })
  ips = new Collection<Ref<PlayerIp>>(this)

  @Property()
  name: string

  @Unique()
  @Property()
  ucid: string

  constructor(newPlayer: NewPlayer) {
    super()

    const { name, ucid } = newPlayer

    this.name = name
    this.ucid = ucid
  }
}
