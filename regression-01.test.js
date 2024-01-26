import { setupServer, request } from "./setupServer";

const server = setupServer([]);

beforeAll(() => {
  server.listen()
  server.use(["GET", "/two", 2])
})

afterEach(() => {
  server.reset()
})

it('relies on the override from beforeAll', async () => {
  expect(await request("GET", "/two")).toEqual(2)
})

it('relies on the override in the test', async () => {
  server.use(["GET", "/two", 202])
  expect(await request("GET", "/two")).toEqual(202)
})

it('cannot access beforeAll override since it has been reset', async () => {
  expect(await request("GET", "/two")).toEqual(null)
})
