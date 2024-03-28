export function download(url, opts) {
  return this.messaging.request(
    {
      method: 'download',
      params: { url, opts },
    },
    opts,
  )
}
