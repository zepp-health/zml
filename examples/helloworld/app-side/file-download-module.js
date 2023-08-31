const logger = Logger.getLogger('test-network-download')

export const fileDownloadModule = {
  async onRunFileDownload() {
    logger.log('downloadTest run')
  },
  testDownloadFile1() {
    // data://download/logo.png
    const task = this.download('https://docs.zepp.com/zh-cn/img/logo.png', {
      headers: {},
      timeout: 6000,
    })

    task.onSuccess = function (data) {
      logger.log('downloadTest success', data)
    }

    task.onFail = function (data) {
      logger.log('downloadTest fail', data)
    }

    task.onComplete = function () {
      logger.log('downloadTest complete')
    }

    task.onProgress = function (data) {
      logger.log('downloadTest progress', data)
    }

    return task
  },
  testDownloadFile2() {
    // data://download/logo2.png
    const task = this.download('https://docs.zepp.com/zh-cn/img/logo.png', {
      headers: {},
      timeout: 6000,
      filePath: 'logo2.png',
    })

    task.onSuccess = function (data) {
      logger.log('downloadTest2 success', data)
    }

    task.onFail = function (data) {
      logger.log('downloadTest2 fail', data)
    }

    task.onComplete = function () {
      logger.log('downloadTest2 complete')
    }

    task.onProgress = function (data) {
      logger.log('downloadTest2 progress', data)
    }

    return task
  },

  testDownloadFile3() {
    const task = this.download(
      encodeURI(
        'https://slider.kz/2000232612_456245272/196/cs2-7v4/s/v1/acmp/m7CWx3R6HsWGOnUO4BW0T-wF_Un-dzTdg46AVn0w0fs8cUG0IiY3gunS6SPYDM9k5xU3I6qu_3P3_CMNNL7UXh1kw3jfBe3SUFnpMcRonEE3P3axDRD5CPhlCgZ7OFeFo7AHymT-Z03s-yF3X8aiAzWpdhPkPol2B5gruQ6ca89hcLiYig/Feid & Young Miko - Classy 101.mp3',
      ),
      {
        headers: {},
        timeout: 10 * 60 * 1000,
        filePath: 'test.mp3',
      },
    )

    task.onSuccess = function (data) {
      logger.log('downloadTest3 success', data)
    }

    task.onFail = function (data) {
      logger.log('downloadTest3 fail', data)
    }

    task.onComplete = function () {
      logger.log('downloadTest3 complete')
    }

    task.onProgress = function (data) {
      logger.log('downloadTest3 progress', data)
    }

    return task
  },
}
