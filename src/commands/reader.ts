import { Character, EOF } from './lexer'

export interface Reader {
  /**
   * consume
   * @param distance the number of chars forward in the reader to consume
   *  subsequent seek/consume calls will use this distance to determine the new reader position
   */
  consume(distance?: number): Character
  /**
   * look ahead
   * @param distance the number of chars forward in the reader to peek
   */
  peek(distance?: number): Character
  /**
   * current reader position
   */
  position(): number
}

export function reader(input: string): Reader {
  let position = 0

  return {
    peek(distance = 0): Character {
      if (isEOF(input, position)) {
        return EOF
      }
      return input.charAt(position + distance)
    },
    consume(distance = 0): Character {
      if (isEOF(input, position)) {
        return EOF
      }
      const consumed = input.charAt(position + distance)
      position = position + distance + 1
      return consumed
    },
    position(): number {
      return position
    },
  }
}

function isEOF(input: string, position: number): boolean {
  return position > input.length - 1
}
