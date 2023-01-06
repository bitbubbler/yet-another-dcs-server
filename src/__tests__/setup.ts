import { orm } from '../db/db'

jest.mock('../cli', () => ({
  options: {
    address: 'hi',
  },
}))

beforeEach(async () => {
  await (await orm).getSchemaGenerator().refreshDatabase()
})

afterAll(async () => {
  await (await orm).close()
})
