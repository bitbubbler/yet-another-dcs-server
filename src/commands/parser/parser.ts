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
  if (
    TokenKind.String !== typeToken.kind &&
    TokenKind.Word !== typeToken.kind
  ) {
    throw new ParserUnexpectedTokenError({
      expected: TokenKind.String,
      found: typeToken,
    })
  }

  const type = matchCommand(typeToken.value)

  if (CommandType.Spawn === type) {
    type Units = { unitName: string; count?: number }[]

    const units: Units = []

    // process all remaining tokens
    const parseParts = (units: Units): void => {
      const nextToken = lexer.nextToken()

      if (TokenKind.EOF === nextToken.kind) {
        return
      }

      // if string or word, assume it's a unitName
      if (
        TokenKind.String === nextToken.kind ||
        TokenKind.Word === nextToken.kind
      ) {
        const unitName = nextToken.value

        units.push({ unitName })

        return parseParts(units)
      }

      // if number, assume name will follow
      if (TokenKind.Number === nextToken.kind) {
        const count = nextToken.value
        const unitNameToken = lexer.nextToken()

        if (
          TokenKind.String === unitNameToken.kind ||
          TokenKind.Word === unitNameToken.kind
        ) {
          const unitName = unitNameToken.value

          units.push({ unitName, count })

          return parseParts(units)
        }
        throw new Error('unitNameToken was not a string')
      }
      throw new Error('unexpected token parsing arguments')
    }

    parseParts(units)

    return {
      type: CommandType.Spawn,
      units,
    }
  }

  if (CommandType.Destroy === type) {
    return {
      type: CommandType.Destroy,
    }
  }

  return { type: CommandType.Unknown }
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
