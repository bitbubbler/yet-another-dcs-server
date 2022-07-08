import { Subject } from 'rxjs'

/**
 * IMPORTANT: README FIRST
 *
 * This file exists to solve circular dependencies
 *
 * This file should ONLY IMPORT
 */

/**
 * A subject of void that produces values when the mission restarts
 */
export const Restarts = new Subject<void>()
