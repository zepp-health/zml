import { _r } from '../../shared/platform.js'

export function stringify(obj) {
  if (!obj || typeof obj !== 'object') {
    throw new Error('obj is required and must be an object')
  }

  const parts = []

  for (let [key, value] of Object.entries(obj)) {
    key = encodeURIComponent(key)

    if (Array.isArray(value)) {
      // handle array
      value.forEach((item) => {
        parts.push(`${key}[]=${encodeURIComponent(item)}`)
      })
    } else {
      // handle regular value
      parts.push(`${key}=${encodeURIComponent(value)}`)
    }
  }

  return parts.join('&')
}

export const parse = _r('@zos/utils').qs.parse
