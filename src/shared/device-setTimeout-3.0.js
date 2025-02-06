import { _r } from '../shared/platform.js'

const _setTimeout = _r('@zos/timer').setTimeout
const _clearTimeout = _r('@zos/timer').clearTimeout

export { _setTimeout as setTimeout, _clearTimeout as clearTimeout }
