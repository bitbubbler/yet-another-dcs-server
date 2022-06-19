import { Argument, Command, CommandType } from '../types'
import { Reader } from '../reader'
import { lexer as Lexer, TokenKind } from '../lexer'
import { ParserUnexpectedTokenError, ParserUnknownTokenError } from './errors'

export type Value = string | number | (string | number)[] | Command

type Lexer = ReturnType<typeof Lexer>

export function parse(reader: Reader): Value {
  const lexer = Lexer(reader)

  const nextToken = lexer.nextToken()

  if (TokenKind.Exclamation === nextToken.kind) {
    // assume the input will be a command
    return processCommand(lexer)
  }
  if (TokenKind.Hyphen === nextToken.kind) {
    // assume the input will be a command
    return processCommand(lexer)
  }

  throw new ParserUnknownTokenError({ token: nextToken })
}

function processCommand(lexer: Lexer): Command {
  const typeToken = lexer.nextToken()

  // assume next token is the command type
  if (TokenKind.String !== typeToken.kind) {
    throw new ParserUnexpectedTokenError({
      expected: TokenKind.String,
      found: typeToken,
    })
  }

  const type = matchCommand(typeToken.value)

  const args = processArguments(lexer)

  if (CommandType.Spawn === type) {
    if (args.length < 1) {
      // TODO: typed error
      throw new Error('expected 1 argument, recieved 0')
    }
    if (typeof args[0] !== 'string') {
      throw new Error('expected string argument, found numer')
    }

    const unitName = args[0]

    return {
      type: CommandType.Spawn,
      unitName,
    }
  }

  if (CommandType.Destroy === type) {
    return {
      type: CommandType.Destroy,
    }
  }

  return { type: CommandType.Unknown }
}

function processArguments(lexer: Lexer): Argument[] {
  const args: Argument[] = []

  // process all remaining tokens
  while (true) {
    const nextToken = lexer.nextToken()

    if (TokenKind.EOF === nextToken.kind) {
      break
    }

    if (TokenKind.String === nextToken.kind) {
      args.push(nextToken.value)
      continue
    }
    if (TokenKind.Number === nextToken.kind) {
      args.push(nextToken.value)
      continue
    }
    // TODO: use a typed error here
    throw new Error('unexpected token parsing arguments')
  }

  return args
}

function matchCommand(input: string): CommandType {
  if ('spawn' === input) {
    return CommandType.Spawn
  }
  if ('destroy' === input) {
    return CommandType.Destroy
  }

  return CommandType.Unknown
}
