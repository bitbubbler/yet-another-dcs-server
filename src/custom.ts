import { Coalition } from '../generated/dcs/common/v0/Coalition'
import { Position } from '../generated/dcs/common/v0/Position'
import { MarkPanelsMissingError } from './errors'
import { services } from './services'

export interface MarkPanel {
  id: number
  coalition: Coalition
  position: Position
  text?: string
  groupId: number
}

const { custom } = services

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

          const coalition: Coalition = coalitionFrom(maybeMark.coalition)

          const mark: MarkPanel = {
            id: maybeMark.idx,
            groupId: maybeMark.groupID,
            coalition,
            position: maybeMark.pos,
            text: maybeMark.text,
          } as MarkPanel

          marks.push(mark)
        })

        return resolve(marks)
      }

      return reject(new Error('failed to handle getMarkPanels response'))

      // if (!markPanels) {
      //   return reject(new MarkPanelsMissingError())
      // }

      // resolve(markPanels)
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
  throw new Error('unknown coalition value from lua')
}
