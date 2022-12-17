import { strict as assert } from 'assert'
import { Lexer } from './Lexer'
import {
  BeginTableKeyToken,
  BeginTableToken,
  Reader,
  StringToken,
  TokenKind,
  Table,
  Value,
} from './types'

export function parse(reader: Reader): Value {
  const lexer = new Lexer(reader)
  const output: Value = {}

  const nextToken = lexer.nextToken()

  if (TokenKind.VARIABLE_NAME === nextToken.kind) {
    const key = nextToken.name
    const value = processValue(lexer)

    output[key] = value

    return output
  }

  throw new Error('Unexpected parse failure')
}

function processValue(lexer: Lexer): Value {
  // expect a single equals
  assert.strictEqual(lexer.nextToken().kind, TokenKind.EQUALS)

  // this should be the beginning of the value, figure out what type of value
  const nextToken = lexer.nextToken()

  if (TokenKind.BEGIN_TABLE === nextToken.kind) {
    return processTable(lexer, nextToken)
  }
  if (TokenKind.STRING === nextToken.kind) {
    return nextToken.value
  }
  if (TokenKind.BOOLEAN === nextToken.kind) {
    return nextToken.value
  }
  if (TokenKind.NUMBER === nextToken.kind) {
    return nextToken.value
  }

  throw new Error('whoops?')
}

function processTableKey(
  lexer: Lexer,
  _startToken: BeginTableKeyToken
): string {
  const value = lexer.nextToken() as StringToken
  assert(value.kind, TokenKind.STRING)
  assert(lexer.nextToken().kind, TokenKind.BEGIN_TABLE_KEY)
  return value.value
}

function processTable(
  lexer: Lexer,
  _startToken: BeginTableToken
): Table | Value[] {
  const table: Table = {}

  const process = (): void => {
    const nextToken = lexer.nextToken()
    if ([TokenKind.EOF].includes(nextToken.kind)) {
      throw new Error('Unexpected end of file')
    }
    if (TokenKind.END_TABLE === nextToken.kind) {
      return
    }
    if ([TokenKind.COMMA, TokenKind.COMMENT].includes(nextToken.kind)) {
      return process()
    }
    if (TokenKind.BEGIN_TABLE_KEY !== nextToken.kind) {
      throw new Error('Expected BEGIN_TABLE_KEY')
    }
    const key = processTableKey(lexer, nextToken)
    const value = processValue(lexer)

    table[key] = value

    process()
  }

  process()

  // if all keys are numbers, this is actually an array
  const allKeysAreNumbers = Object.keys(table).every(
    key => Number.isNaN(Number(key)) === false
  )

  if (allKeysAreNumbers) {
    return Object.values(table)
  }

  return table
}
