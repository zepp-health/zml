import { AppGlobalThis, MGR } from "../../common/global";

export function appPlugin(opt) {
	new AppGlobalThis().setValue(MGR, {})
	opt.$m = {}
}

