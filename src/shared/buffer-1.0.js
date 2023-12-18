let buffer = null

if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = buffer = DeviceRuntimeCore.Buffer
} else {
  buffer = globalThis.Buffer
}

export { buffer as Buffer }
