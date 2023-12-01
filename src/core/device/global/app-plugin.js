import { AppGlobalThis, MGR } from "../../common/global";

export function appPlugin() {
	new AppGlobalThis().setValue(MGR, {})
}

