export class DisposedError extends Error {}

export const dispose = '__$dispose'

export function safeDispose(instance) {
  if (
    typeof instance === 'object' &&
    instance !== null &&
    typeof instance[dispose] === 'function'
  ) {
    try {
      instance[dispose]()
    } catch (ex) {
      return ex
    }
  }
}

export function safeDisposeAll(instances) {
  if (
    typeof instances === 'object' &&
    instances !== null &&
    typeof instances[Symbol.iterator] === 'function'
  ) {
    return [...instances].map(safeDispose)
  }
  return []
}

export function create(callback) {
  return {
    [dispose]: () => {
      callback && callback()
    },
  }
}

export function checkDisposed(instance) {
  if (instance.disposed)
    throw new DisposedError('Try to access to a disposed instance')
}
