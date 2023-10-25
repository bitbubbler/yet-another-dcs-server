import { Coalition } from './__generated__/dcs/common/v0/Coalition'

import { gamePositionLLFrom } from './convert'
import { MarkPanelsMissingError } from './errors'
import { services } from './services'
import { GamePositionLL } from './types'

export interface MarkPanel {
  id: number
  coalition: Coalition
  position: GamePositionLL
  text?: string
  groupId: number
}

const { custom } = services

export async function getMarkById(id: number): Promise<MarkPanel | undefined> {
  let markPanels: MarkPanel[]
  try {
    markPanels = await getMarkPanels()
  } catch (error) {
    if (error instanceof MarkPanelsMissingError) {
      // no-op
      return
    }
    throw error
  }

  const addedMark = markPanels.find(mark => mark.id === id)

  return addedMark
}

/**
 * this might fail if the user in is in a jtac/tac command/game masters slot. not sure why
 * @returns
 */
export async function getMarkPanels(): Promise<MarkPanel[]> {
  const lua = `
    local marks = world.getMarkPanels()
    for _,mark in ipairs(marks) do
        local lat, lon, alt = coord.LOtoLL(mark.pos)
        mark.pos = {
          alt = alt,
          lat = lat,
          lon = lon,
        }
    end
    return marks
`
  return new Promise<MarkPanel[]>((resolve, reject) =>
    custom.eval({ lua }, async (error, result) => {
      if (error) {
        return reject(new MarkPanelsMissingError())
      }

      if (!result || !result.json) {
        throw new Error('missing json from result')
      }

      const resultJson = JSON.parse(result.json) as unknown

      const marks: MarkPanel[] = []

      if (Array.isArray(resultJson)) {
        resultJson.forEach(maybeMark => {
          if (typeof maybeMark !== 'object' || maybeMark === null) {
            return reject(new Error('expected mark to be an object'))
          }
          // TODO: fix type safety consuming maybeMark here. Consider a `markPanelFrom` method

          const coalition: Coalition = coalitionFrom(maybeMark.coalition)

          const mark: MarkPanel = {
            id: maybeMark.idx,
            groupId: maybeMark.groupID,
            coalition,
            position: gamePositionLLFrom(maybeMark.pos),
            text: maybeMark.text,
          } as MarkPanel

          marks.push(mark)
        })
      }

      return resolve(marks)
    })
  )
}

function coalitionFrom(luaCoalition: number): Coalition {
  if (0 === luaCoalition) {
    return Coalition.COALITION_NEUTRAL
  }
  if (1 === luaCoalition) {
    return Coalition.COALITION_RED
  }
  if (2 === luaCoalition) {
    return Coalition.COALITION_BLUE
  }
  if (255 === luaCoalition) {
    return Coalition.COALITION_ALL
  }
  throw new Error('unknown coalition value from lua')
}
