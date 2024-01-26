import { setupServer, request } from "./setupServer";

const server = setupServer([]);

beforeAll(() => server.listen());
/**
 * @note Jest doesn't support `afterEach` in concurrent mode.
 * But you don't need that because "server.boundary()" encapsulates
 * the request handler changes within that function's scope.
 */

test.concurrent("uses initial handlers", server.boundary(async () => {
  expect(await request("GET", "/one")).toEqual(null);
  expect(await request("GET", "/two")).toEqual(null);
}));

test.concurrent("adds two overrides", server.boundary(async () => {
  server.use(["GET", "/two", 202], ["GET", "/three", 3]);
  expect(await request("GET", "/one")).toEqual(null);
  expect(await request("GET", "/two")).toEqual(202);
  expect(await request("GET", "/three")).toEqual(3);
}));

test.concurrent("adds one override", server.boundary(async () => {
  server.use(["GET", "/two", 2]);
  expect(await request("GET", "/two")).toEqual(2);
  expect(await request("POST", "/one")).toEqual(null);
}));

test.concurrent("uses initial handlers after reset", server.boundary(async () => {
  expect(await request("GET", "/one?a=1")).toEqual(null);
  expect(await request("GET", "/two")).toEqual(null);
}));

test.concurrent("adds in-test overrides", server.boundary(async () => {
  expect(await request("GET", "/two")).toEqual(null);

  server.use(["GET", "/two", 123]);
  expect(await request("GET", "/two")).toEqual(123);

  server.use(["GET", "/three", 333]);
  expect(await request("GET", "/two")).toEqual(123);
  expect(await request("GET", "/three")).toEqual(333);

  server.reset();
  expect(await request("GET", "/two")).toEqual(null);
  expect(await request("GET", "/three")).toEqual(null);
}));
