# ZML

English | [简体中文](./README_CN.md)

A mini development library for Zepp OS mini programs. Currently integrates network requests, communication and other functions.

## API_LEVEL Required
This library requires **API_LEVEL 3.0 or above**.


## Usage

### Direct APIs

Direct apis include: 
* http requests
* downloading file
* receiving file
* download and receive file
* get settings for specific keys

#### Use in app.js

```javascript
import { BaseApp } from '@zeppos/zml/base-app'

App(
  BaseApp({
    globalData: {},
    onCreate() {},
    onDestroy(opts) {},
  }),
)
```

#### Use in page module

```javascript
import { BasePage } from '@zeppos/zml/base-page'
Page(
  BasePage({
    state: {},
    build() {},

    onInit() {
      this.getYourData()
    },

    getYourData() {
      return this.httpRequest({
        method: 'get',
        url: 'your url',
      })
        .then((result) => {
          console.log('result.status', result.status)
          console.log('result.statusText', result.statusText)
          console.log('result.headers', result.headers)
          console.log('result.body', result.body)
        })
        .catch((error) => {
          console.error('error=>', error)
        })
    },

    downloadYourFile() {
      return this.download('your download url')
        .then((result) => {
          console.log('file downloaded successfully')
        })
        .catch((error) => {
          console.error('Error while downloading file=>', error)
        })
    },

    receiveYourFile() {
      return this.receiveFile('file path', {
        type: 'file type',
        name: 'file path'
      })
        .then((result) => {
          console.log('file transferred successfully')
        })
        .catch((error) => {
          console.error('Error while transferring file=>', error)
        })
    },

    downloadAndTransferYourFile() {
      return this.download('file path', {
        transfer: {
          path: 'file path',
          opts: {
            type: 'file type',
            name: 'file path'
          }
        }
      })
        .then((result) => {
          console.log('file downloaded and transferred successfully')
        })
        .catch((error) => {
          console.error('Error while downloading/transferring file=>', error)
        })
    },

    getSettings() {
      return this.getSettings(['setting1', 'setting2'])
        .then((result) => {
          console.log('settings received successfully')
          const settings1 = result.settings1
          const settings2 = result.settings2
        })
        .catch((error) => {
          console.error('Error while retrieving settings=>', error)
        })
    },
    
    onDestroy() {
      console.log('page onDestroy invoked')
    },
  }),
)
```

#### Use in sideService module

```javascript
import { BaseSideService } from '@zeppos/zml/base-side'

AppSideService(BaseSideService())
```

See [examples/helloworld1](./examples/helloworld1)

### request APIs

APIs related to communication with the phone

1. Use request, call to send data
2. Use onRequest, onCall to receive data

#### Use in app.js

```javascript
import { BaseApp } from '@zeppos/zml/base-app'

App(
  BaseApp({
    globalData: {},
    onCreate() {},
    onDestroy() {},
  }),
)
```

#### Use in page module

```javascript
import { BasePage } from '@zeppos/zml/base-page'
Page(
  BasePage({
    build() {},

    onInit() {
      this.getDataFromMobile()
    },

    getDataFromMobile() {
      return this.request({
        method: 'your.method1',
        params: {
          param1: 'param1',
          param2: 'param2',
        },
      })
        .then((result) => {
          // receive your data
          console.log('result=>', result)
        })
        .catch((error) => {
          // receive your error
          console.error('error=>', error)
        })
    },
    notifyMobile() {
      this.call({
        method: 'your.method3',
        params: {
          param1: 'param1',
          param2: 'param2',
        },
      })
    },
    onRequest(req, res) {
      // need reply
      // node style callback
      // first param is error
      // second param is your data
      if (req.method === 'your.method2') {
        // do something
        console.log('req=>', JSON.string(req))
        res(null, {
          test: 1,
        })
      } else {
        res('error happened')
      }
    },
    onCall(data) {
      // no reply
      if (req.method === 'your.method4') {
        // do something
        console.log('req=>', JSON.string(data))
      }
    },
    onDestroy() {
      console.log('page onDestroy invoked')
    },
  }),
)
```

#### Use in sideService module

```javascript
import { BaseSideService } from '@zeppos/zml/base-side'

AppSideService(
  BaseSideService({
    onInit() {

    },
    onRun() {

    },
    getDataFromDevice() {
      return this.request({
        method: 'your.method2',
        params: {
          param1: 'param1',
          param2: 'param2'
        }
      })
        .then((result) => {
          // receive your data
          console.log('result=>', result)
        })
        .catch((error) => {
          // receive your error
          console.error('error=>', error)
        })
    },
    notifyDevice() {
      this.call({
        method: 'your.method4',
        params: {
          param1: 'param1',
          param2: 'param2'
        }
      })
    },
    onRequest(req, res) {
      // need reply
      // node style callback
      // first param is error
      // second param is your data
      if (req.method === 'your.method1') {
        // do something
        res(null, {
          test: 1
        })
      } else {
        res('error happened')
      }
    },
    onCall(data) {
      onCall(data) {
      // no reply
      if (req.method === 'your.method3') {
        // do something
      }
    },

    },
    onDestroy() {

    }
  }),
)
```
See [examples/helloworld2](./examples/helloworld2)


### More complex example

See [examples/helloworld3](./examples/helloworld3)


## License

Licensed under the [Apache License, Version 2.0](LICENSE.txt) license.

Copyright (c) 2023-present Zepp Health. All Rights Reserved.