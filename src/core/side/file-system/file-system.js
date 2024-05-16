export const fileSystem = {
  readFile(path, opt) {
    return fs.readFile(path, opt)
  },
  writeFile(path, data, opt) {
    return fs.writeFile(path, data, opt)
  },
  onInputFile(cb) {
    fs.on('inputFile', cb)
    return this
  },
  offInputFile(cb) {
    fs.off('inputFile', cb)
    return this
  },
}
