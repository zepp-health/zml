declare module "@zeppos/zml/base-app" {
	interface BaseAppFunc {
		(): void
	}

	export const BaseApp: BaseAppFunc
}


declare module "@zeppos/zml/base-page" {
	interface BasePageFunc {
		(): void
	}

	export const BasePage: BasePageFunc
}

declare module "@zeppos/zml/base-side" {
	interface BaseSideServiceFunc {
		(): void
	}

	export const BaseSideService: BaseSideServiceFunc
}