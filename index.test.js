import { AsyncLocalStorage } from "node:async_hooks";

async function request(method, path) {
  return null;
}

const store = new AsyncLocalStorage();

function setupServer(initialHandlers) {
  let getHandlers = () => {
    const context = store.getStore();
    return context?.handlers || initialHandlers;
  };

  store.enterWith({ handlers: initialHandlers });

  return {
    listen() {
      request = new Proxy(request, {
        async apply(target, context, args) {
          const [method, path] = args;

          const handlers = getHandlers();
          const mockedResponse = await handleRequest(
            { method, path },
            handlers,
          );
          return mockedResponse || Reflect.apply(target, context, args);
        },
      });
    },
    reset() {
      store.enterWith({ handlers: initialHandlers });
    },
    use(...runtimeHandlers) {
      const currentHandlers = getHandlers();
      const nextHandlers = [...currentHandlers, ...runtimeHandlers];

      store.enterWith({ handlers: nextHandlers });
    },
  };
}

async function handleRequest(request, handlers) {
  const { method, path } = request;

  return handlers.find((handler) => {
    return handler[0] === method && handler[1] === path;
  })?.[2];
}

const server = setupServer([]);

beforeAll(() => server.listen());
afterEach(() => server.reset());

test.concurrent("uses initial handlers", async () => {
  expect(await request("GET", "/one")).toEqual(null);
  expect(await request("GET", "/two")).toEqual(null);
});

test.concurrent("adds two overrides", async () => {
  server.use(["GET", "/two", 202], ["GET", "/three", 3]);
  expect(await request("GET", "/one")).toEqual(null);
  expect(await request("GET", "/two")).toEqual(202);
  expect(await request("GET", "/three")).toEqual(3);
});

test.concurrent("adds one override", async () => {
  server.use(["GET", "/two", 2]);
  expect(await request("GET", "/two")).toEqual(2);
  expect(await request("POST", "/one")).toEqual(null);
});

test.concurrent("uses initial handlers after reset", async () => {
  expect(await request("GET", "/one")).toEqual(null);
  expect(await request("GET", "/two")).toEqual(null);
});

test.concurrent("adds in-test overrides", async () => {
  expect(await request("GET", "/two")).toEqual(null);

  server.use(["GET", "/two", 123]);
  expect(await request("GET", "/two")).toEqual(123);

  server.use(["GET", "/three", 333]);
  expect(await request("GET", "/two")).toEqual(123);
  expect(await request("GET", "/three")).toEqual(333);

  server.reset();
  expect(await request("GET", "/two")).toEqual(null);
  expect(await request("GET", "/three")).toEqual(null);
});
