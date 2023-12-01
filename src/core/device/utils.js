export function getAppGlobalModules(...args) {
	const m = getApp().$m

	const r = args.reduce((t, c) => {
		t.push(m[c])
		return t
	}, [])

	return r
}

export function getGlobalData() {
	return getApp()._options.globalData
}