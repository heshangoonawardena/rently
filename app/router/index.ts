import { implement } from "@orpc/server";
import { contract } from "../contract";
import { BaseContext } from "./middleware";
import { createUnit, deleteUnit, listUnit, updateUnit } from "./unit";

const os = implement(contract).$context<BaseContext>();

export const router = os.router({
	unit: {
		create: createUnit,
		update: updateUnit,
		delete: deleteUnit,
		list: listUnit,
	},
});
