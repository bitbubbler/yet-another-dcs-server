/**
 * IMPORTANT: This file is for global _utility_ types only
 *
 * Application types should NOT go in this file
 */

/** */ // fixes the first type assuming the above is it's description

export type primitive = string | number | boolean | undefined | null
export type DeepReadonly<T> = T extends primitive ? T : DeepReadonlyObject<T>
export type DeepReadonlyObject<T> = {
  readonly [P in keyof T]: DeepReadonly<T[P]>
}
