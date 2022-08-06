import { BirthEvent, Events, EventType } from '../events'
import { TeardownFn } from '../common'
import { GroupMenu, MissionMenu } from './types'

/**
 *
 * @param missionMenus an ordered array of root menus. the order of menus in this array is the order they will appear on the client
 * @param groupMenus an ordered array of root menus. the order of menus in this array is the order they will appear on the client.
 * groupMenus always appear after missionMenus
 */
export async function menusMain(
  missionMenus: MissionMenu[],
  groupMenus: GroupMenu[]
): Promise<TeardownFn> {
  /**
   * IMPORTANT: README before modifying
   *
   * The logic to build menu commands is centralized into this single file in
   * order to solve the "menu ordering" problem that dcs creates for us
   * When a menu is created in dcs, it is created in the order you call
   * the create menu command functions. This means we have to create all
   * menus at the same time in order to have control over order
   *
   * We also need to be able to delete all menus in the event of an issue,
   * to "reset" to a clean/known state before attempting to create in a
   * known/desired order again
   *
   * To that end, the create and teardown is owned by this function.
   * While we delegate the sub-menus to other files, the order of the root
   * menus is to be owned by this function, and the order in which the delegate
   * functions are called.
   * The order they are called in is meant to determine the order of the root menus.
   */

  // remove all mission menus concurrently
  await Promise.all(
    missionMenus.map(async menu => {
      await menu.remove()
    })
  )

  // then add each missions menu back, one by one to enforce our desired order
  for (const menu of missionMenus) {
    // then (re)create the menu
    await menu.create()
  }

  // listen for birth events to setup group menus
  const subscription = Events.subscribe(async event => {
    if (EventType.Birth === event.type) {
      return handleBirth(event as BirthEvent)
    }
  })

  // for groups, we create menus at birth
  async function handleBirth(event: BirthEvent) {
    if (!event.initiator.unit) {
      // no-op
      return
    }
    const { groupName } = event.initiator.unit

    if (!groupName) {
      throw new Error('expected player entering unit to have groupName')
    }

    // remove all group menus concurrently
    await Promise.all(
      groupMenus.map(async menu => {
        await menu.remove({ groupName })
      })
    )

    // TODO: figure out if birth events is the best way to handle group menus.
    // it seems, through testing, that group menus persist even when you change slots.
    // so they are not tied to a client.
    // then add each missions menu back, one by one to enforce our desired order
    for (const menu of groupMenus) {
      // then (re)create the menu
      await menu.create({ groupName })
    }
  }

  // teardown fn
  return async () => {
    subscription.unsubscribe()
  }
}
