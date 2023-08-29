export const settingsLib = {
  onChange(cb) {
    if (!cb) return
    settings.settingsStorage.addListener('change', cb)
  },
  offChange() {
    settings.settingsStorage.removeListener('change')
  },
  getItem(i) {
    return settings.settingsStorage.getItem(i)
  },
  setItem(i, value) {
    return settings.settingsStorage.setItem(i, value)
  },
  clear() {
    return settings.settingsStorage.clear()
  },
  removeItem(i) {
    settings.settingsStorage.removeItem(i)
  },
  getAll() {
    return settings.settingsStorage.toObject()
  },
}
