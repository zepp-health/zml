# Getting Started

## Overview

**Enable communication and network capabilities for Zepp OS mini-programs quickly**

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

The `MessageBuilder` mini-program communication library has been around for a long time, and currently has the following problems:

> 1. It needs to be manually imported and cannot be used out of the box.
> 2. It is too complex for users, requiring a lot of configuration.
> 3. It is incompatible with `Zepp OS1, OS2, OS3` versions.
> 4. It has poor scalability

`zml` library was created to solve these problems, and here are its main features and advantages:
> 1. It is ready to use out of the box, requiring only one module to be imported.
> 2. It has simple configuration, requiring only the configuration object to be passed in.
> 3. It supports `Zepp OS1, OS2, OS3` versions.
> 4. It supports plugin extensions.

Using the `zml` library allows you to focus on the implementation of business logic without spending a lot of time and effort dealing with configuration issues.


## Install

```bash [node]
npm install @zeppos/zml
```

## Usage

### `app.js`

You should import `BaseApp` module.

```js {3}
// app.js
import { BaseApp } from '@zeppos/zml/base-app'
App(BaseApp({}),)
```

### `side-service.js`

You should import `BaseSideService` module.

```js{3}
// side-service.js
import { BaseSideService } from '@zeppos/zml/base-side'
AppSideService(BaseSideService({}),)
```


### `page.js`

You should import `BasePage` module.

```js{3}
// page.js
import { BasePage } from '@zeppos/zml/base-page'
Page(BasePage({}),)
```

### Fire your request
In your `page.js` file，you can use `httpRequest` method to send `http` request.

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

## License

[Apache-2.0](https://github.com/zepp-health/zml/blob/main/LICENSE.txt)