export function downloadPlugin(opt) {
	opt.download = function(url, opts) {
    const task = network.downloader.downloadFile({
      url,
      ...opts,
    })

    return task
  }
}

export const API_LEVEL = __API_LEVEL__