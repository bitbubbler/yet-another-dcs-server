import { searchUnits } from '../searchUnits'

describe('spawnUnits/searchUnits', () => {
  // each here takes an array of input/output tuples
  // the output is an object of properties/attributes to check
  // [ [ input, output ] ]
  it.each([
    ['t55', { typeName: 'T-55' }],
    ['abrams', { typeName: 'M-1 Abrams' }],
    ['meph', { typeName: 'VAB_Mephisto' }],
    ['tr', { typeName: 'Hawk tr' }],
    ['ln', { typeName: 'Hawk ln' }],
  ])('should return a valid match for %s', (input, output) => {
    const { typeName } = output

    expect(searchUnits(input)).toEqual(
      expect.objectContaining({
        desc: expect.objectContaining({
          typeName,
        }),
      })
    )
  })
})
