const pluginService = {
	init() {
		this.plugins = []
		this.settings = {};
	},
	set(setting, val) {
		if (arguments.length === 1) {
			return this.settings[setting];
		}

		this.settings[setting] = val;
	},
	use(plugin, ...args) {
		if (plugin) {
			this.plugins.push({
				handler: plugin,
				args
			})
		}
		return this
	},
	handle(moduleOpts) {
		this.plugins.forEach(p => {
			if (!p) return
			if (typeof p.handler === 'function') {
				p.handler.call(this, moduleOpts, ...p.args)
			}
		});
	}
}

export {
	pluginService
}