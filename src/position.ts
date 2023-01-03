import { PositionLL } from './common'

export interface Position extends PositionLL {
  positionId: number
  heading: number
}
