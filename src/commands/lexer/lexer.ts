import { notStrictEqual, strictEqual } from 'assert'
import { WordToken } from '.'
import { Reader } from '../reader'
import { Character, EOF, StringToken, Token, TokenKind } from './types'

export function lexer(reader: Reader) {
  // public functions
  function nextToken(): Token {
    const nextChar = reader.peek()

    if (EOF === nextChar) {
      reader.consume()
      return {
        kind: TokenKind.EOF,
      }
    }

    // ignore all whitespace
    if (isWhitespace(nextChar)) {
      skipWhitespace()
      return nextToken()
    }

    if ('&' === nextChar) {
      reader.consume()
      if ('&' === reader.peek(1)) {
        reader.consume()
      }
      return {
        kind: TokenKind.And,
      }
    }

    if ('a' === nextChar && 'n' === reader.peek(1) && 'd' === reader.peek(2)) {
      reader.consume(2)
      return {
        kind: TokenKind.And,
      }
    }

    // numbers (including negative numbers)
    if (
      ('-' === nextChar && isNumber(reader.peek(1) as string)) ||
      isNumber(nextChar)
    ) {
      return {
        kind: TokenKind.Number,
        value: processNumbers(),
      }
    }

    if ('!' === nextChar) {
      reader.consume()
      return {
        kind: TokenKind.Exclamation,
      }
    }

    if ('-' === nextChar) {
      reader.consume()
      return {
        kind: TokenKind.Hyphen,
      }
    }

    // strings start with quotes
    if ('"' === nextChar || "'" === nextChar) {
      return processString()
    }

    // words don't need to be quoted
    if (/[a-z]/i.test(nextChar)) {
      return processWord()
    }

    throw new Error(
      `unexpected token \`${nextChar}\` at position ${reader.position()}`
    )
  }

  return {
    nextToken,
  }

  // private functions
  function processString(quoteless = false): StringToken {
    if (quoteless === false) {
      // opening quote
      processQuoationMark()
    }

    // use a loop to build the value
    const valueParts: string[] = []

    while (true) {
      const lastChar = valueParts[valueParts.length - 1]
      const nextChar = reader.peek()
      if (quoteless && isWhitespace(nextChar)) {
        // end of string
        break
      }

      // things that end quoteless strings
      if (quoteless) {
        if (EOF === nextChar) {
          break
        }
        if ('&' === nextChar) {
          break
        }
        if (
          'a' === nextChar &&
          'n' === reader.peek(1) &&
          'd' === reader.peek(2)
        ) {
          break
        }
      }
      if (EOF === nextChar) {
        if (quoteless) {
          // end of string
          break
        }
        // TODO: use a typed error here
        throw new Error('Unexpected end of input')
      }
      if ('"' === nextChar) {
        break
      }
      valueParts.push(reader.consume() as string)
    }

    if (quoteless === false) {
      // closing quote
      processQuoationMark()
    }

    return {
      kind: TokenKind.String,
      value: valueParts.join(''),
    }
  }

  // NOTE: must handle: positive and negative numbers, decimals
  function processNumbers(): number {
    const numbers: string[] = [] // array of single chars

    // go into a look that we will break ourselves once complete
    while (true) {
      const nextChar = reader.peek()
      if (nextChar === EOF) {
        break
      }
      // if a number
      if (/^[0-9.-]$/.test(nextChar)) {
        numbers.push(reader.consume() as string)
      } else {
        // if we stop getting matches, yield back
        break
      }
    }

    const number = Number(numbers.join(''))
    notStrictEqual(number, NaN)
    return Number(numbers.join(''))
  }

  // private fns
  function processWord(): WordToken {
    const value: Character[] = []

    // dumb loop that we will exit ourselves
    while (true) {
      const nextChar = reader.peek()

      if (nextChar === EOF) {
        break
      }

      // words can have letter and number
      if (/[a-z0-9]/i.test(nextChar)) {
        value.push(reader.consume() as string)
        continue
      }

      // break once we stop finding letters
      break
    }

    return {
      kind: TokenKind.Word,
      value: value.join(''),
    }
  }

  function processQuoationMark(): void {
    const char = reader.consume()

    if (typeof char !== 'string' || ['"', "'"].includes(char) === false) {
      throw new Error('char was not a quotation mark')
    }
  }

  function isNumber(char: Character): boolean {
    if (EOF === char) {
      return false
    }
    return /^[0-9]$/.test(char)
  }

  function isWhitespace(char: Character): boolean {
    if (EOF === char) {
      return false
    }
    return (
      char.charAt(0) === ' ' ||
      char.charAt(0) === '\n' ||
      char.charAt(0) === '\r'
    )
  }

  function skipWhitespace(): void {
    const nextChar = reader.peek()
    if (nextChar === EOF) {
      return
    }
    // if next char is whitespace
    if (isWhitespace(nextChar)) {
      // consume the whitespace
      reader.consume()
      // keep going
      return skipWhitespace()
    } else {
      // be done when there is no more whitespace
      return
    }
  }
}
