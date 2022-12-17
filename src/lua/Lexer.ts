import { strict as assert } from 'assert'
import {
  CommentToken,
  EOF,
  Reader,
  StringToken,
  Token,
  TokenKind,
  VariableNameToken,
} from './types'

export class Lexer {
  private reader: Reader

  constructor(reader: Reader) {
    this.reader = reader
  }

  public nextToken(): Token {
    const nextChar = this.reader.peek()

    if (nextChar === EOF) {
      return {
        kind: TokenKind.EOF,
      }
    }

    // ignore all whitespace
    if (this.isWhitespace(nextChar)) {
      this.skipWhitespace()
      return this.nextToken()
    }

    if (
      't' === nextChar &&
      'r' === this.reader.peek(1) &&
      'u' === this.reader.peek(2) &&
      'e' === this.reader.peek(3)
    ) {
      this.reader.consume(3)
      return {
        kind: TokenKind.BOOLEAN,
        value: true,
      }
    }

    if (
      'f' === nextChar &&
      'a' === this.reader.peek(1) &&
      'l' === this.reader.peek(2) &&
      's' === this.reader.peek(3) &&
      'e' === this.reader.peek(4)
    ) {
      this.reader.consume(4)
      return {
        kind: TokenKind.BOOLEAN,
        value: false,
      }
    }

    // comma
    if (',' === nextChar) {
      this.reader.consume()
      return {
        kind: TokenKind.COMMA,
      }
    }

    // table key open
    if ('[' === nextChar) {
      this.reader.consume()
      return {
        kind: TokenKind.BEGIN_TABLE_KEY,
      }
    }

    // table key close
    if (']' === nextChar) {
      this.reader.consume()
      return {
        kind: TokenKind.END_TABLE_KEY,
      }
    }

    // table open
    if ('{' === nextChar) {
      this.reader.consume()
      return {
        kind: TokenKind.BEGIN_TABLE,
      }
    }

    // table close
    if ('}' === nextChar) {
      this.reader.consume()
      return {
        kind: TokenKind.END_TABLE,
      }
    }

    // numbers (including negative numbers)
    if (
      ('-' === nextChar && this.isNumber(this.reader.peek(1) as string)) ||
      this.isNumber(nextChar)
    ) {
      return {
        kind: TokenKind.NUMBER,
        value: this.processNumbers(),
      }
    }

    // lua inline comments
    if ('-' === nextChar && this.reader.peek(1) === '-') {
      return this.processInlineComment()
    }

    // strings
    if ('"' === nextChar) {
      return this.processString()
    }

    // equals
    if ('=' === nextChar) {
      this.reader.consume()
      return {
        kind: TokenKind.EQUALS,
      }
    }

    // variables
    if (/^[a-z]$/i.test(nextChar)) {
      return this.processVariableName()
    }

    throw new Error(`Lexer invalid token error. token: ${nextChar}`)
  }

  private isNumber(char: string): boolean {
    return /^[0-9]$/.test(char)
  }

  private isWhitespace(char: string): boolean {
    return (
      char.charAt(0) === ' ' ||
      char.charAt(0) === '\n' ||
      char.charAt(0) === '\r'
    )
  }

  private skipWhitespace(): void {
    const nextChar = this.reader.peek()
    if (nextChar === EOF) {
      return
    }
    // if next char is whitespace
    if (this.isWhitespace(nextChar)) {
      // consume the whitespace
      this.reader.consume()
      // keep going
      return this.skipWhitespace()
    } else {
      // be done when there is no more whitespace
      return
    }
  }

  private processInlineComment(): CommentToken {
    // consume the two hyphens
    this.reader.consume()
    this.reader.consume()

    const commentParts: string[] = []

    // consume the rest as a value, until the newline
    while (true) {
      const nextChar = this.reader.peek()
      if (nextChar === EOF) {
        break
      }
      if ('\n' === nextChar || '\r' === nextChar) {
        break
      }

      commentParts.push(this.reader.consume() as string)
    }

    return {
      kind: TokenKind.COMMENT,
      value: commentParts.join(''),
    }
  }

  private processString(): StringToken {
    // opening quote
    this.processQuoationMark()

    // use a loop to build the value
    const valueParts: string[] = []
    while (true) {
      const lastChar = valueParts[valueParts.length - 1]
      const nextChar = this.reader.peek()
      if (nextChar === EOF) {
        throw new Error('Unexpected end of file')
      }
      if (nextChar === '"' && lastChar === '\\') {
        valueParts.push(this.reader.consume() as string)
        continue
      }
      if (nextChar === '"') {
        break
      }
      valueParts.push(this.reader.consume() as string)
    }

    // closing quote
    this.processQuoationMark()
    return {
      kind: TokenKind.STRING,
      value: valueParts.join(''),
    }
  }

  private processQuoationMark(): void {
    const char = this.reader.consume()
    assert.strictEqual(char, '"', 'char was not a quotation mark')
  }

  private processVariableName(): VariableNameToken {
    const name = this.processLetters()

    return {
      kind: TokenKind.VARIABLE_NAME,
      name,
    }
  }

  // NOTE: must handle: positive and negative numbers, decimals
  private processNumbers(): number {
    const numbers: string[] = [] // array of single chars

    // go into a look that we will break ourselves once complete
    while (true) {
      const nextChar = this.reader.peek()
      if (nextChar === EOF) {
        throw new Error('Unexpected end of file')
      }
      // if a number
      if (/^[0-9.-]$/.test(nextChar)) {
        numbers.push(this.reader.consume() as string)
      } else {
        // if we stop getting matches, yield back
        break
      }
    }

    const number = Number(numbers.join(''))
    assert.notStrictEqual(number, NaN)
    return Number(numbers.join(''))
  }
  private processLetters(): string {
    const letters: string[] = [] // array of single chars

    // go into a look that we will break ourselves once complete
    while (true) {
      const nextChar = this.reader.peek()
      if (nextChar === EOF) {
        break
      }
      // if a letter
      if (/^[a-z]$/i.test(nextChar)) {
        // it's part of the variable name
        letters.push(this.reader.consume() as string)
      } else {
        // if we stop getting matches, yield back
        break
      }
    }

    return letters.join('')
  }
}
