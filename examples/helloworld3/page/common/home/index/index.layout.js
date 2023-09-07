import { BTN_STYLE } from './index.style'
import ui from '@zos/ui'
import { getText } from '@zos/i18n'

export const layout = {
  refs: {},
  render(vm) {
    this.refs.btn1 = ui.createWidget(ui.widget.TEXT, {
      ...BTN_STYLE,
      text: getText('appName'),
    })

    this.refs.btn2 = ui.createWidget(ui.widget.BUTTON, {
      ...BTN_STYLE,
      y: BTN_STYLE.y + 100,
      click_func: () => {
        vm.goBlePage()
      },
    })

    this.refs.btn3 = ui.createWidget(ui.widget.BUTTON, {
      ...BTN_STYLE,
      y: BTN_STYLE.y + 200,
      color: 0xff00ff,
      text: '测试文件传输',
      click_func: () => {
        vm.goFilePage()
      },
    })

    this.refs.btn5 = ui.createWidget(ui.widget.BUTTON, {
      ...BTN_STYLE,
      y: BTN_STYLE.y + 300,
      color: 0xff00ff,
      text: '测试蓝牙 http 代理',
      click_func: () => {
        vm.goBleHttp()
      },
    })
  },
}
