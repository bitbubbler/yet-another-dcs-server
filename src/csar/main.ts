import { Events } from '../events'

export async function csarMain(): Promise<() => Promise<void>> {
  await Promise.all(
    (
      await allCsar()
    ).map(async csar => {
      await spawnCsar(csar)
    })
  )

  const subscription = Events.subscribe(async event => {
    //
  })

  return async () => {
    subscription.unsubscribe()
  }
}
