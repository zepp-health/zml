export function convertPlugin (opt) {
  opt.convert = function (opts) {
    return image.convert(opts)
  }
}

export const API_LEVEL = __API_LEVEL__