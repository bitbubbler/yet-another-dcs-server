import { Coalition } from '../../generated/dcs/common/v0/Coalition'
import { MarkupType, NewTextMarkup } from '../../markup'
import { knex } from '../db'
import { deleteMarkup, insertMarkup } from '../markups'

const newMarkup: NewTextMarkup = {
  type: MarkupType.Text,
  coalition: Coalition.COALITION_BLUE,
  fillColor: { red: 1, green: 0, blue: 0, alpha: 1 },
  lineColor: { red: 1, green: 0, blue: 0, alpha: 1 },
  fontSize: 22,
  position: { lat: 1, lon: 2, alt: 3 },
  readonly: true,
  text: 'test',
}

describe('db/markups', () => {
  describe('delete', () => {
    it('should destroy proper', async () => {
      const markup = await insertMarkup(newMarkup)

      const allColors = await knex('colors').select('*')

      expect(allColors.length).toEqual(0)
    })
  })
})
