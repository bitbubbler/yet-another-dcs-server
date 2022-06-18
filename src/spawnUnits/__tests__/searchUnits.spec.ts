import { searchUnits } from '../searchUnits'

describe('spawnUnits/searchUnits', () => {
  it('should return a matching unit', () => {
    expect(searchUnits('t55')).toEqual(
      expect.objectContaining({
        desc: expect.objectContaining({
          typeName: 'T-55',
        }),
      })
    )
  })
})
