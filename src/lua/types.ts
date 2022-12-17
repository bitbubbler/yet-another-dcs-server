export const EOF: unique symbol = Symbol()

export enum TokenKind {
  VARIABLE_NAME = 'VARIABLE_NAME',
  COMMA = 'COMMA',
  COMMENT = 'COMMENT',
  EOF = 'EOF',
  EQUALS = 'EQUALS',
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  BEGIN_TABLE = 'BEGIN_TABLE',
  END_TABLE = 'END_TABLE',
  BEGIN_TABLE_KEY = 'BEGIN_TABLE_KEY',
  END_TABLE_KEY = 'END_TABLE_KEY',
}

export interface TokenShape {
  kind: TokenKind
}

export interface EOFToken extends TokenShape {
  kind: TokenKind.EOF
}
export interface BooleanToken extends TokenShape {
  kind: TokenKind.BOOLEAN
  value: true | false
}
export interface CommentToken extends TokenShape {
  kind: TokenKind.COMMENT
  value: string
}
export interface CommaToken extends TokenShape {
  kind: TokenKind.COMMA
}
export interface EqualsToken extends TokenShape {
  kind: TokenKind.EQUALS
}
export interface BeginTableToken extends TokenShape {
  kind: TokenKind.BEGIN_TABLE
}
export interface EndTableToken extends TokenShape {
  kind: TokenKind.END_TABLE
}
export interface BeginTableKeyToken extends TokenShape {
  kind: TokenKind.BEGIN_TABLE_KEY
}
export interface EndTableKeyToken extends TokenShape {
  kind: TokenKind.END_TABLE_KEY
}
export interface StringToken extends TokenShape {
  kind: TokenKind.STRING
  value: string
}
export interface NumberToken extends TokenShape {
  kind: TokenKind.NUMBER
  value: number
}

export interface VariableNameToken extends TokenShape {
  kind: TokenKind.VARIABLE_NAME
  name: string
}

export type Token =
  | EOFToken
  | BooleanToken
  | CommaToken
  | CommentToken
  | VariableNameToken
  | StringToken
  | NumberToken
  | EqualsToken
  | BeginTableKeyToken
  | BeginTableToken
  | EndTableKeyToken
  | EndTableToken

export type Character = string | typeof EOF

export interface Reader {
  peek(distance?: number): Character
  consume(distance?: number): Character
}

export type Value = string | number | boolean | null | Value[] | Table

export type Table = { [key: string]: Value }

export type Input = Value
