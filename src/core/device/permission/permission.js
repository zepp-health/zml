import { _r } from '../../../shared/platform.js'
const { queryPermission, requestPermission } = _r('@zos/app')
const { showToast } = _r('@zos/interaction')
export class Permission {
  static PermissionStatus = {
    unauthorized: 0,
    error: 1,
    authorized: 2,
  }

  static RequestPermissionResult = {
    cancel: 0,
    error: 1,
    granted: 2,
  }

  static request(permissions, cb) {
    const result = queryPermission({
      permissions,
    })[0]

    switch (result) {
      case Permission.PermissionStatus.unauthorized:
        requestPermission({
          permissions,
          callback([res]) {
            switch (res) {
              case Permission.RequestPermissionResult.granted:
                showToast({
                  content: 'permission: granted',
                })
                cb && cb({ code: res })
                break
              case Permission.RequestPermissionResult.cancel:
                showToast({
                  content: 'permission: canceled',
                })
                cb && cb({ error: new Error(res) })
                break
              default:
                showToast({
                  content: 'permission: request error',
                })
                cb && cb({ error: new Error(res) })
                break
            }
          },
        })
        break
      case Permission.PermissionStatus.authorized:
        cb && cb({ code: result })
        break
      default:
        showToast({
          content: 'permission: query error',
        })
        cb && cb({ error: new Error(result) })
        break
    }
  }
}
