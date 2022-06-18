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
        unitName: 'T55',
      })
    })
  })
})
