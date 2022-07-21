import {
  Command,
  CommandType,
  DefineSpawnGroupCommand,
  ToDestroy,
} from '../types'
import { Reader } from '../reader'
import { lexer as Lexer, TokenKind } from '../lexer'
import { ParserUnexpectedTokenError, ParserUnknownTokenError } from './errors'
import { Coalition } from '../../../generated/dcs/common/v0/Coalition'
import { SpawnerType } from '../../autoRespawn/types'

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
    let coalition: Coalition | undefined

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
        const lowerValue = nextToken.value.toLowerCase()

        // coalition
        if ('red' === lowerValue) {
          coalition = Coalition.COALITION_RED
          return parseParts()
        }
        if ('blue' === lowerValue) {
          coalition = Coalition.COALITION_BLUE
          return parseParts()
        }

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
      coalition,
    }
  }

  if (CommandType.Destroy === type) {
    // destroy takes an optional type to destroy, otherwise it destroys the closest thing
    // destroy will destroy units and spawners
    // destroy takes an optional radius
    let typeToDestroy: ToDestroy | undefined
    let coalition: Coalition | undefined
    let radius: number | undefined

    const parseParts = (): void => {
      const nextToken = lexer.nextToken()

      if (TokenKind.EOF === nextToken.kind) {
        return
      }

      // if string or word, assume it's typeToDestroy
      if (
        TokenKind.String === nextToken.kind ||
        TokenKind.Word === nextToken.kind
      ) {
        const lowerValue = nextToken.value.toLowerCase()

        // try to match string token value to a known type or coalition token
        if (/^unit/.test(lowerValue) === true) {
          typeToDestroy = ToDestroy.Unit
          return parseParts()
        }
        if (/^spawner/.test(lowerValue) === true) {
          typeToDestroy = ToDestroy.Spawner
          return parseParts()
        }

        // check for coalition
        if (lowerValue === 'red') {
          coalition = Coalition.COALITION_RED
          return parseParts()
        }
        if (lowerValue === 'blue') {
          coalition = Coalition.COALITION_BLUE
          return parseParts()
        }
        if (lowerValue === 'all') {
          coalition = Coalition.COALITION_ALL
          return parseParts()
        }

        // takes rad(ius) as keyword and expects value in meters in next token
        if (/^rad/.test(lowerValue) === true) {
          const radiusValueToken = lexer.nextToken()

          if (TokenKind.Number !== radiusValueToken.kind) {
            throw new Error('expected number token following radius keyword')
          }

          radius = radiusValueToken.value

          return parseParts()
        }
        throw new Error('unexpected token found')
      }

      // if number, assume it's radius
      if (TokenKind.Number === nextToken.kind) {
        radius = nextToken.value
        return parseParts()
      }
    }

    parseParts()

    return {
      type: CommandType.Destroy,
      toDestroy: typeToDestroy,
      radius: radius,
      coalition: coalition,
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

      let radius: number | undefined = undefined

      const parseParts = () => {
        const nextToken = lexer.nextToken()

        if (
          TokenKind.Word === nextToken.kind ||
          TokenKind.String === nextToken.kind
        ) {
          const lowerValue = nextToken.value.toLowerCase()
          // except a radius by name
          if (lowerValue === 'radius') {
            const radiusValueToken = lexer.nextToken()

            if (TokenKind.Number !== radiusValueToken.kind) {
              throw new Error('expected number token following radius keyword')
            }

            radius = radiusValueToken.value
          }
        }
      }

      parseParts()

      if (radius) {
        return {
          type: CommandType.SpawnGroup,
          groupName,
          radius,
        }
      }

      return {
        type: CommandType.SpawnGroup,
        groupName,
      }
    }

    throw new Error('unexpected token parsing spawnGroup')
  }

  if (CommandType.Smoke === type) {
    const nextToken = lexer.nextToken()

    if (
      TokenKind.Word === nextToken.kind ||
      TokenKind.String === nextToken.kind
    ) {
      const color = nextToken.value

      return {
        type: CommandType.Smoke,
        color,
      }
    }
    return {
      type: CommandType.Smoke,
    }
  }

  if (CommandType.Flare === type) {
    const nextToken = lexer.nextToken()
    if (
      TokenKind.Word === nextToken.kind ||
      TokenKind.String === nextToken.kind
    ) {
      const color = nextToken.value

      return {
        type: CommandType.Flare,
        color,
      }
    }
    return {
      type: CommandType.Flare,
    }
  }

  if (CommandType.Illumination === type) {
    return {
      type: CommandType.Illumination,
    }
  }

  if (CommandType.CreateSpawner === type) {
    let spawnerType: SpawnerType | undefined
    let coalition: Coalition | undefined
    let onRoad: boolean | undefined

    const parseParts = () => {
      const nextToken = lexer.nextToken()

      if (
        TokenKind.String === nextToken.kind ||
        TokenKind.Word === nextToken.kind
      ) {
        const lowerValue = nextToken.value.toLowerCase()

        // coalition
        if ('red' === lowerValue) {
          coalition = Coalition.COALITION_RED
        }
        if ('blue' === lowerValue) {
          coalition = Coalition.COALITION_BLUE
        }

        // spawner type
        if ('easy' === lowerValue) {
          spawnerType = SpawnerType.Easy
        }
        if ('medium' === lowerValue) {
          spawnerType = SpawnerType.Medium
        }
        if ('hard' === lowerValue) {
          spawnerType = SpawnerType.Hard
        }

        if ('onroad' === lowerValue) {
          onRoad = true
        }
      }
    }

    parseParts()

    return {
      type: CommandType.CreateSpawner,
      coalition,
      onRoad,
      spawnerType,
    }
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
  if ('smoke' === lowerInput) {
    return CommandType.Smoke
  }
  if ('flare' === lowerInput) {
    return CommandType.Flare
  }
  if ('illum' === lowerInput || 'illumination' === lowerInput) {
    return CommandType.Illumination
  }
  if ('spawner' === lowerInput) {
    return CommandType.CreateSpawner
  }

  return CommandType.Unknown
}
