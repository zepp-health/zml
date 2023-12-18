import { convertLib } from './convert'
export function convertPlugin(opt) {
  opt.convert = function (opts) {
    return convertLib.convert(opts)
  }
}

export { convertLib }

export const API_LEVEL = __API_LEVEL__
