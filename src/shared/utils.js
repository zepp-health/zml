import { Buffer } from './buffer.js'

export function isPlainObject(item) {
  return (
    typeof item === 'object' &&
    !Buffer.isBuffer(item) &&
    !Array.isArray(item) &&
    item !== null
  )
}
