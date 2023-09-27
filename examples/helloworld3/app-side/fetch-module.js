const logger = Logger.getLogger('test-message-fetch')

export const fetchModule = {
  async onRunFetch() {
    logger.log('fetchTest run')
  },
  async testGetHtml2() {
    const result = await this.fetch({
      method: 'get',
      url: 'https://bible-api.com/john%203:17',
    }).catch((e) => {
      console.log('test fetch=>', e)
    })

    logger.log('test api', result.body)

    return JSON.parse(result.body).text
  },
}
