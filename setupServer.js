import { AsyncLocalStorage, executionAsyncId, triggerAsyncId } from "node:async_hooks";

export async function request(method, path) {
  return null;
}

const store = new AsyncLocalStorage();

export function setupServer(initialHandlers) {
  let _getHandlers = () => {
    const context = store.getStore();
    console.log({ context })
    return context?.handlers || initialHandlers;
  };

  const trace = new Map()
  function getHandlers(id) {
    console.log('getHandlers()', id)

    const fromCurrent = trace.get(id)

    // Find the lowest ID key in "trace" Map
    // and return its value.
    // This is the closest ancestor.
    const ids = Array.from(trace.keys())
    const lowestId = Math.min(...ids)
    const fromAncestor = trace.get(lowestId)

    console.log('getHandlers()', { for: id, lowestId, fromCurrent, fromAncestor })

    return fromCurrent || fromAncestor || initialHandlers
  }

  return {
    listen() {
      request = new Proxy(request, {
        async apply(target, context, args) {
          const [method, path] = args;

          const handlers = _getHandlers(executionAsyncId())

          console.log(method, path, handlers)

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
      console.log('use()', executionAsyncId(), triggerAsyncId(), runtimeHandlers)

      const currentHandlers = _getHandlers(executionAsyncId());
      const nextHandlers = [...runtimeHandlers, ...currentHandlers];

      store.enterWith({ handlers: nextHandlers });
    },
  }
}

async function handleRequest(request, handlers) {
  const { method, path } = request;

  return handlers.find((handler) => {
    return handler[0] === method && handler[1] === path;
  })?.[2];
}
