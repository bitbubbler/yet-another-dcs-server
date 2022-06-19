export const EOF: unique symbol = Symbol()

export type Character = string | typeof EOF

export enum TokenKind {
  EOF,
  Exclamation,
  String,
  Word,
  Hyphen,
  Number,
  Equals,
  And,
}

export interface EOFToken {
  kind: TokenKind.EOF
}

export interface ExclamationToken {
  kind: TokenKind.Exclamation
}

export interface StringToken {
  kind: TokenKind.String
  value: string
}

export interface WordToken {
  kind: TokenKind.Word
  value: string
}

export interface NumberToken {
  kind: TokenKind.Number
  value: number
}

export interface HyphenToken {
  kind: TokenKind.Hyphen
}

export interface EqualsToken {
  kind: TokenKind.Equals
}

export interface AndToken {
  kind: TokenKind.And
}

export type Token =
  | EOFToken
  | ExclamationToken
  | StringToken
  | NumberToken
  | HyphenToken
  | EqualsToken
  | AndToken
  | WordToken
