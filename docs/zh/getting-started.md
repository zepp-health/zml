# 开始

## 介绍

**让小程序快速拥有通信和网络能力**

发送 `http` 请求
```js{5-10}
// page.js
import { BasePage } from '@zeppos/zml/base-page'
Page(BasePage({
  onInit() {
    this.httpRequest({
      method: 'GET',
      url: 'https://bible-api.com/john%203:16',
    }).then(result => {
      this.log(result)
    })
  }
}),)
```

小程序通信库 `MessageBuilder` 已经存在很久，目前他有以下问题：

> 1. 需要手动引入，不能开箱即用。
> 2. 对于使用者来说他使用过于复杂，需要配置的东西比较多。
> 3. 对 `Zepp OS1，OS2，OS3` 版本不兼容。
> 4. 扩展能力很差

`zml` 库就是为了解决这这些问题而生的：

> 1. 开箱即用，要引入一个模块。
> 2. 配置简单，只需传入配置对象即可。
> 3. 支持 `Zepp OS1，OS2，OS3` 版本。
> 4. 支持插件扩展

他可以让你专注于业务逻辑，而不用去配置那些繁琐的配置。


## 安装

```bash [node]
npm install @zeppos/zml
```

## 使用

### `app.js`
引入 `BaseApp` 模块
```js {3}
// app.js
import { BaseApp } from '@zeppos/zml/base-app'
App(BaseApp({}),)
```

### `side-service.js`
引入 `BaseSideService` 模块
```js{3}
// side-service.js
import { BaseSideService } from '@zeppos/zml/base-side'
AppSideService(BaseSideService({}),)
```


### `page.js`
引入 `BasePage` 模块

```js{3}
// page.js
import { BasePage } from '@zeppos/zml/base-page'
Page(BasePage({}),)
```

### 发送 `http` 请求
在 你的 `page.js` 文件中，你可以使用 `httpRequest` 方法来发送 `http` 请求。

```js{5-10}
// page.js
import { BasePage } from '@zeppos/zml/base-page'
Page(BasePage({
  onInit() {
    this.httpRequest({
      method: 'GET',
      url: 'https://bible-api.com/john%203:16',
    }).then(result => {
      this.log(result)
    })
  }
}),)
```

## 许可

[Apache-2.0](https://github.com/zepp-health/zml/blob/main/LICENSE.txt)