import { Input, Table } from './types'

export function stringify(input: Input): string {
  return doStringify(input)
}

function doStringify(
  input: Input,
  depth = 0,
  keyName?: string | number
): string {
  const tab = (width = depth) =>
    Array.from({ length: width }).reduce(previous => `${previous}    `, '')

  if (Array.isArray(input)) {
    return doStringify(
      input.reduce<Table>(
        (previous, current, index) => ({ ...previous, [index + 1]: current }),
        {}
      ),
      depth,
      keyName
    )
  }
  if (typeof input === 'object' && input !== null) {
    const objectStringParts = []

    if (depth === 0) {
      Object.keys(input).forEach(keyString => {
        const value = input[keyString]
        const key =
          Number.isNaN(parseInt(keyString)) === false
            ? Number(keyString)
            : keyString

        objectStringParts.push(`${key} =${doStringify(value, depth + 1, key)}`)
      })
    } else {
      objectStringParts.push(`\n${tab(depth - 1)}{`)

      Object.keys(input).forEach(keyString => {
        const key =
          Number.isNaN(parseInt(keyString)) === false
            ? Number(keyString)
            : keyString
        const value = doStringify(input[keyString], depth + 1, key)

        const output = (keyString: string): void => {
          const definition = (value: string) =>
            `\n${tab(depth)}[${keyString}] =${value}`
          if (value[0] === '\n') {
            objectStringParts.push(definition(`${value}`))
            return
          }
          objectStringParts.push(definition(` ${value}`))
          return
        }

        if (typeof key === 'number') {
          output(`${key}`)
        } else {
          output(`"${key}"`)
        }
      })

      const comment = () => {
        const endOf = (thing: string): string => {
          return ` -- end of ${thing}`
        }
        if (keyName) {
          if (typeof keyName === 'number') {
            return endOf(`[${keyName}]`)
          }
          if (depth === 1) {
            return endOf(keyName)
          }
          return endOf(`["${keyName}"]`)
        }
        return ''
      }

      const comma = () => {
        if (depth < 2) {
          return ''
        }
        return ','
      }

      objectStringParts.push(`\n${tab(depth - 1)}}${comma()}${comment()}`)
    }

    return objectStringParts.join('')
  }
  if (typeof input === 'string') {
    return `"${input}",`
  }
  if (typeof input === 'number') {
    return `${input},`
  }
  if (typeof input === 'boolean') {
    return `${input},`
  }

  throw new Error('something unknown was reached')
}
