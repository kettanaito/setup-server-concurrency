import { setupServer, request } from "./setupServer";

const server = setupServer([]);
// server.use(["GET", "/two", 2])

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

it('relies on the override from beforeAll', async () => {
  expect(await request("GET", "/two")).toEqual(2)
})
