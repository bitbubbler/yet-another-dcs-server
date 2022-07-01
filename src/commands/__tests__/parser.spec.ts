import { parse } from '../parser'
import { reader } from '../reader'
import { CommandType } from '../types'

describe('commands/parser', () => {
  it('should parse the basic command format without args', () => {
    expect(parse(reader('!unknown'))).toEqual({ type: CommandType.Unknown })
  })
  describe('spawn command', () => {
    it('should parse a spawn command with a basic unit name', () => {
      expect(parse(reader('!spawn T55'))).toEqual({
        type: CommandType.Spawn,
        units: [{ fuzzyUnitName: 'T55' }],
      })
    })
    describe('unit count', () => {
      it('should parse unit count before fuzzyUnitName', () => {
        expect(parse(reader('!spawn 3 T55'))).toEqual({
          type: CommandType.Spawn,
          units: [{ fuzzyUnitName: 'T55', count: 3 }],
        })
      })
      it('should parse two units with a number between', () => {
        expect(parse(reader('!spawn T55 3 abrams'))).toEqual({
          type: CommandType.Spawn,
          units: [
            { fuzzyUnitName: 'T55' },
            { fuzzyUnitName: 'abrams', count: 3 },
          ],
        })
      })
      it('should parse two units, first with a number ', () => {
        expect(parse(reader('!spawn 6 T55 abrams'))).toEqual({
          type: CommandType.Spawn,
          units: [
            { fuzzyUnitName: 'T55', count: 6 },
            { fuzzyUnitName: 'abrams' },
          ],
        })
      })
      it('should parse two units, both with a number before', () => {
        expect(parse(reader('!spawn 2 T55 4 abrams'))).toEqual({
          type: CommandType.Spawn,
          units: [
            { fuzzyUnitName: 'T55', count: 2 },
            { fuzzyUnitName: 'abrams', count: 4 },
          ],
        })
      })
    })
  })
  describe('destroy command', () => {
    it('should parse a spawn command with a basic unit name', () => {
      expect(parse(reader('!destroy'))).toEqual({
        type: CommandType.Destroy,
      })
    })
  })
})
