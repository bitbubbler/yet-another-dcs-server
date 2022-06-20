import {
  Argument,
  Command,
  CommandType,
  DefineSpawnGroupCommand,
} from '../types'
import { Reader } from '../reader'
import { lexer as Lexer, TokenKind } from '../lexer'
import { ParserUnexpectedTokenError, ParserUnknownTokenError } from './errors'

export type Value = string | number | (string | number)[] | Command

type Lexer = ReturnType<typeof Lexer>

export function parse(reader: Reader): Command {
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
    type Units = { fuzzyUnitName: string; count?: number }[]

    const units: Units = []

    // process all remaining tokens
    const parseParts = (): void => {
      const nextToken = lexer.nextToken()

      if (TokenKind.EOF === nextToken.kind) {
        return
      }

      // if string or word, assume it's a unitName
      if (
        TokenKind.String === nextToken.kind ||
        TokenKind.Word === nextToken.kind
      ) {
        const fuzzyUnitName = nextToken.value

        units.push({ fuzzyUnitName })

        return parseParts()
      }

      // if number, assume name will follow
      if (TokenKind.Number === nextToken.kind) {
        const count = nextToken.value
        const unitNameToken = lexer.nextToken()

        if (
          TokenKind.String === unitNameToken.kind ||
          TokenKind.Word === unitNameToken.kind
        ) {
          const fuzzyUnitName = unitNameToken.value

          units.push({ fuzzyUnitName, count })

          return parseParts()
        }
        throw new Error('unitNameToken was not a string')
      }
      throw new Error('unexpected token parsing arguments')
    }

    parseParts()

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

  if (CommandType.DefineSpawnGroup === type) {
    const units: DefineSpawnGroupCommand['units'] = []
    let groupName: string

    const groupNameToken = lexer.nextToken()

    if (
      TokenKind.Word === groupNameToken.kind ||
      TokenKind.String === groupNameToken.kind
    ) {
      groupName = groupNameToken.value
    } else {
      throw new Error('invalid groupNameToken')
    }

    const parseUnitNames = (): void => {
      const nextToken = lexer.nextToken()

      if (
        TokenKind.Word === nextToken.kind ||
        TokenKind.String === nextToken.kind
      ) {
        units.push({ fuzzyUnitName: nextToken.value })

        return parseUnitNames()
      }
    }

    parseUnitNames()

    return {
      type: CommandType.DefineSpawnGroup,
      groupName,
      units,
    }
  }

  if (CommandType.SpawnGroup === type) {
    const nextToken = lexer.nextToken()

    if (
      TokenKind.Word === nextToken.kind ||
      TokenKind.String === nextToken.kind
    ) {
      const groupName = nextToken.value

      return {
        type: CommandType.SpawnGroup,
        groupName,
      }
    }

    throw new Error('unexpected token parsing spawnGroup')
  }

  return { type: CommandType.Unknown }
}

function matchCommand(input: string): CommandType {
  const lowerInput = input.toLowerCase()

  if ('spawn' === lowerInput) {
    return CommandType.Spawn
  }
  if ('destroy' === lowerInput) {
    return CommandType.Destroy
  }
  if ('defgroup' === lowerInput || 'definegroup' === lowerInput) {
    return CommandType.DefineSpawnGroup
  }
  if ('spawngroup' === lowerInput) {
    return CommandType.SpawnGroup
  }

  return CommandType.Unknown
}
