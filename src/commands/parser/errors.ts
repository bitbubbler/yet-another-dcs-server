import { Token, TokenKind } from '../lexer'

export class ParserUnknownTokenError extends Error {
  constructor({ token }: { token: Token }) {
    super(`unknown token ${token}`)

    Object.setPrototypeOf(this, ParserUnknownTokenError.prototype)
  }
}

export class ParserUnexpectedTokenError extends Error {
  constructor({ expected, found }: { found: Token; expected: TokenKind }) {
    super(`unexpected token ${found} expected ${expected}`)

    Object.setPrototypeOf(this, ParserUnexpectedTokenError.prototype)
  }
}
