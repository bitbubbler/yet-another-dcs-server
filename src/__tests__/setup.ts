import { orm } from '../db/connection'

jest.mock('../cli', () => ({
  options: {
    address: 'hi',
    dbName: ':memory:',
  },
}))

beforeEach(async () => {
  await (await orm).getSchemaGenerator().clearDatabase()
})

afterAll(async () => {
  await (await orm).close()
})
