import { Entity, ManyToOne, Unique } from '@mikro-orm/core'
import { CargoBase } from '../Cargo'
import { Unit } from '.'

@Entity({ tableName: 'unitCargos' })
@Unique({ properties: ['cargo', 'unit'] })
export class UnitUnitCargo {
  @ManyToOne({ fieldName: 'cargoId', primary: true })
  cargo: CargoBase

  @ManyToOne({ fieldName: 'unitId', primary: true })
  unit: Unit

  constructor(newUnitCargo: Pick<UnitUnitCargo, 'cargo' | 'unit'>) {
    const { cargo, unit } = newUnitCargo

    this.cargo = cargo
    this.unit = unit
  }
}
