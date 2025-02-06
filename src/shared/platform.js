export function isHmAppDefined() {
  return typeof hmApp !== 'undefined'
}

export function isZeppOS1() {
  return isZeppOS() && isAPILevel1()
}

export function isZeppOS2() {
  return isZeppOS() && isAPILevel2()
}

export function isAPILevel1() {
  return isHmAppDefined()
}

export function isAPILevel2() {
  return typeof __$$R$$__ !== 'undefined'
}

export function isZeppOS() {
  return isAPILevel1() || isAPILevel2()
}

export function isSideService() {
  return typeof messaging !== 'undefined'
}

let _r = null

if (typeof __$$R$$__ !== 'undefined') {
  _r = __$$R$$__
} else {
  _r = () => ({})
}

export { _r }