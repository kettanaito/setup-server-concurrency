import { AsyncLocalStorage, executionAsyncId, triggerAsyncId } from "node:async_hooks";

export async function request(method, path) {
  return null;
}

const store = new AsyncLocalStorage();

export function setupServer(initialHandlers) {
  const rootContext = { initialHandlers, handlers: [] }

  function getContext() {
    return store.getStore() || rootContext
  }

  return {
    boundary(callback){
      return (...args) => {
        const context = getContext()
        // Respect request handlers added before this boundary
        // has been established.
        const initialHandlers = [...context.handlers, ...context.initialHandlers]
        return store.run({ initialHandlers, handlers: [] }, callback, args)
      }
    },
    listen() {
      request = new Proxy(request, {
        async apply(target, thisArg, args) {
          const [method, path] = args;
          console.log(method, path)

          const context = getContext()
          const handlers = [
            ...context.handlers,
            ...context.initialHandlers
          ]

          const mockedResponse = await handleRequest(
            { method, path },
            handlers,
          );
          return mockedResponse || Reflect.apply(target, thisArg, args);
        },
      });
    },
    reset() {
      getContext().handlers = []
    },
    use(...runtimeHandlers) {
      getContext().handlers.unshift(...runtimeHandlers);
    },
  }
}

async function handleRequest(request, handlers) {
  const { method, path } = request;

  return handlers.find((handler) => {
    return handler[0] === method && handler[1] === path;
  })?.[2];
}
