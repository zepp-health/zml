import { getFileTransfer } from '../../common/file-transfer.js'
import { _r } from '../../common/common.js'

const TransferFile = _r('@zos/ble/TransferFile')
export const fileTransferLib = getFileTransfer(
  TransferFile ? new TransferFile() : undefined,
)
