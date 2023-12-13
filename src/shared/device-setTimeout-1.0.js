export function clearTimeout(timerRef) {
	timerRef && timer.stopTimer(timerRef)
}

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

if (typeof globalThis.setTimeout === 'undefined') {
	globalThis.setTimeout = setTimeout
	globalThis.clearTimeout = clearTimeout
}

if (typeof globalThis.Buffer === 'undefined') {
	globalThis.Buffer = DeviceRuntimeCore.Buffer
}