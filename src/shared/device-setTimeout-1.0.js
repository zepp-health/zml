export function clearTimeout(timerRef) {
	timerRef && timer.stopTimer(timerRef)
}

globalThis.clearTimeout = clearTimeout

export function setTimeout(func, ms) {
	const timer1 = timer.createTimer(
		ms || 1,
		ms || 1,
		function() {
			globalThis.clearTimeout(timer1)
			func && func()
		},
		{},
	)

	return timer1
}

globalThis.setTimeout = setTimeout
globalThis.Buffer = DeviceRuntimeCore.Buffer