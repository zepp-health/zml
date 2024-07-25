export function httpRequest(data, opts = {}) {
  return this.request(
    {
      method: 'http.request',
      params: data,
    },
    opts,
  )
}
