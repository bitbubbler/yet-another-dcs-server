/**
 * IMPORTANT: This file is for global _utility_ types only
 *
 * Application types should NOT go in this file
 */

/** */ // fixes the first type assuming the above is it's description

declare type primitive = string | number | boolean | undefined | null
declare type DeepReadonly<T> = T extends primitive ? T : DeepReadonlyObject<T>
declare type DeepReadonlyObject<T> = {
  readonly [P in keyof T]: DeepReadonly<T[P]>
}
