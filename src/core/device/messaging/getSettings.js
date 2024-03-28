export function getSettings(settings, opts) {
  return this.messaging.request(
    {
      method: 'getSettings',
      params: {
        settings,
      },
    },
    opts,
  )
}
