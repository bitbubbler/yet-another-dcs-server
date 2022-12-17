import { UnitTypeName } from '../unit'
import UH1H from './uh-1h.json'
import AH64D from './ah-64d.json'

// TODO: use real types here, I used any here becasue I was feeling lazy
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function unitTemplateFrom(typeName: UnitTypeName): any {
  if (UnitTypeName.UH1H === typeName) {
    return UH1H
  }
  if (UnitTypeName.AH64D === typeName) {
    return AH64D
  }
  throw new Error(`No unit template for typename ${typeName}`)
}
