export function receiveFile(path, opts) {
  return this.messaging.request(
    {
      method: 'receiveFile',
      params: {
        path,
        opts,
      },
    },
    opts,
  )
}
