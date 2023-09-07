AppSettingsPage({
  // 测试
  build(props) {
    return Section({}, [
      View(
        {
          style: {
            marginTop: '50px',
            textAlign: 'center',
          },
        },
        [
          Button({
            label: '清空设置数据',
            // color: 'secondary',
            color: 'default',
            onClick: () => {
              props.settingsStorage.setItem('data:clear', true)
            },
          }),
        ],
      ),
      ////////////////////////////////////////////////////////////////
      View(
        {
          style: {
            marginTop: '50px',
            textAlign: 'center',
          },
        },
        [Text({}, ['测试蓝牙'])],
      ),
      View(
        {
          style: {
            marginTop: '10px',
            textAlign: 'center',
          },
        },
        [
          Button({
            label: '测试蓝牙接口',
            color: 'primary',
            onClick: () => {
              props.settingsStorage.setItem('ble:start', true)
            },
          }),
        ],
      ),
      View(
        {
          style: {
            marginTop: '10px',
            textAlign: 'center',
          },
        },
        [
          Button({
            label: '测试拉起小程序首页',
            color: 'primary',
            onClick: () => {
              props.settingsStorage.setItem('app:start', true)
            },
          }),
        ],
      ),
      ////////////////////////////////////////////////////////////////
      View(
        {
          style: {
            marginTop: '50px',
            textAlign: 'center',
          },
        },
        [Text({}, ['网络下载文件'])],
      ),
      View(
        {
          style: {
            marginTop: '10px',
            textAlign: 'center',
          },
        },
        [
          Button({
            label: '开始下载文件',
            color: 'primary',
            onClick: () => {
              props.settingsStorage.setItem('downloadFile:start', true)
            },
          }),
        ],
      ),
      View(
        {
          style: {
            marginTop: '10px',
            textAlign: 'center',
          },
        },
        [
          Button({
            label: '停止下载文件',
            color: 'primary',
            onClick: () => {
              props.settingsStorage.setItem('downloadFile:stop', true)
            },
          }),
        ],
      ),
      ////////////////////////////////////////////////////////////////
      View(
        {
          style: {
            marginTop: '50px',
            textAlign: 'center',
          },
        },
        [Text({}, ['图片转换'])],
      ),
      View(
        {
          style: {
            marginTop: '10px',
            textAlign: 'center',
          },
        },
        [
          Button({
            label: '开始转换图片',
            color: 'primary',
            onClick: () => {
              props.settingsStorage.setItem('convertImage:start', true)
            },
          }),
        ],
      ),
      ////////////////////////////////////////////////////////////////////////
      View(
        {
          style: {
            marginTop: '50px',
            textAlign: 'center',
          },
        },
        [Text({}, ['手机传输文件到设备'])],
      ),
      View(
        {
          style: {
            marginTop: '10px',
            textAlign: 'center',
          },
        },
        [
          Button({
            label: '开始传输文件',
            color: 'primary',
            onClick: () => {
              props.settingsStorage.setItem('sideTransfer:start', true)
            },
          }),
        ],
      ),
      View(
        {
          style: {
            marginTop: '10px',
            textAlign: 'center',
          },
        },
        [
          Button({
            label: '停止传输文件',
            color: 'primary',
            onClick: () => {
              props.settingsStorage.setItem('sideTransfer:stop', true)
            },
          }),
        ],
      ),
      ////////////////////////////////////////////////////////////////////////
      View(
        {
          style: {
            marginTop: '50px',
            textAlign: 'center',
          },
        },
        [Text({}, ['设备传输文件到手机'])],
      ),
      View(
        {
          style: {
            marginTop: '10px',
            textAlign: 'center',
          },
        },
        [
          Button({
            label: '开始传输文件',
            color: 'primary',
            onClick: () => {
              props.settingsStorage.setItem('deviceTransfer:start', true)
            },
          }),
        ],
      ),
      View(
        {
          style: {
            marginTop: '10px',
            textAlign: 'center',
            marginBottom: '50px',
          },
        },
        [
          Button({
            label: '停止传输文件',
            color: 'primary',
            onClick: () => {
              props.settingsStorage.setItem('deviceTransfer:stop', true)
            },
          }),
        ],
      ),
    ])
  },
})
