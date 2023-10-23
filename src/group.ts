import { Group__Output } from './__generated__/dcs/common/v0/Group'
import { services } from './services'
import { PositionLL } from './common'
import { GameUnit, gameUnitFrom } from './unit'

const { coalition, custom, group } = services

export type Group = Required<Group__Output>

export async function groups(): Promise<Group[]> {
  return new Promise<Group[]>((resolve, reject) => {
    coalition.getGroups({}, (error, results) => {
      if (error) {
        console.log('get groups failed', error)
        return reject(error)
      }

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const { groups } = results!

      if (!groups) {
        // if the mission is empty, there will not be any groups on the response
        // it's not common but it is possible.
        return resolve([])
      }

      resolve(groups.map(groupFrom))
    })
  })
}

export async function getUnits(groupName: string): Promise<GameUnit[]> {
  return new Promise<GameUnit[]>((resolve, reject) => {
    group.getUnits(
      {
        groupName,
      },
      (error, result) => {
        if (error) {
          return reject(error)
        }

        if (!result || !result.units) {
          return reject(new Error('expected units on result'))
        }

        resolve(result.units.map(unit => gameUnitFrom(unit)))
      }
    )
  })
}

interface DriveGroundGroupOptions {
  /** groupName to drive */
  groupName: string
  /** the groups starting position (current position) */
  position: PositionLL
  /** Array of zero or more points to drive to along the path (in order). Use to provide starting and ending road points (for one or more roads) */
  points: PositionLL[]
  /** the groups destination position (ending position) */
  destination: PositionLL
  onroad: boolean
}

/** Tuple of [position, onroad]. Position is the point to drive to, onroad is whether the unit should stay on road while driving to the point (best if point is also on road) */
type Point = [PositionLL, boolean]

/**
 *
 * @param param0
 * @returns
 */
export async function driveGroundGroup(
  options: DriveGroundGroupOptions
): Promise<void> {
  const { groupName, position, destination, onroad } = options
  const points: Point[] = []

  points.push([position, onroad])
  points.push(...options.points.map<Point>(point => [point, onroad]))
  points.push([destination, onroad])

  const lua = `
    local group = Group.getByName("${groupName}")
    local controller = group:getController()

    local function point(onroad, position)
      local position = coord.LLtoLO(position.lat, position.lon, position.alt)

      local function action() 
        if onroad then return "On Road" else return "Off Road" end
      end
      
      return {
        x = position.x,
        y = position.z,
        speed = 25,
        type = "Turning Point",
        action = action(),
        task = nil,
      }
    end

    local task = {
      id = 'Mission',
      params = {
        route = {
          points = {}
        },
      }
    }

    ${points
      .map(([point, onroad], index) => {
        const luaIndex: number = index + 1
        const { alt, lat, lon } = point
        return `task.params.route.points[${luaIndex}] = point(${onroad}, { lat = ${lat}, lon = ${lon}, alt = ${alt}})`
      })
      .join('\n')}

    controller:setTask(task)
`.trim()

  return new Promise((resolve, reject) => {
    custom.eval({ lua }, async (error, result) => {
      if (error) {
        return reject(error)
      }

      if (!result || !result.json) {
        throw new Error('missing json from result')
      }

      resolve()
    })
  })
}

export async function groupFromGroupId(
  groupId: number
): Promise<Group & Required<Pick<Group, 'id'>>> {
  const group = (await groups()).find(group => group.id === groupId)

  if (!group) {
    throw new Error('expected to find group in groups with given id')
  }

  return group as Group & Required<Pick<Group, 'id'>>
}

export async function groupFromGroupName(
  groupName: string
): Promise<Group | undefined> {
  const group = (await groups()).find(group => group.name === groupName)

  if (!group) {
    return undefined
  }

  return group
}

export function groupFrom(group: Group__Output): Group {
  if (!group.id) {
    throw new Error('missing id from group')
  }
  if (!group.category) {
    throw new Error('missing category from group')
  }
  if (!group.coalition) {
    throw new Error('missing coalition from group')
  }
  if (!group.name) {
    throw new Error('missing name from group')
  }

  return group as Group
}
