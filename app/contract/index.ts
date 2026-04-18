import {
	createUnitContract,
	deleteUnitContract,
	listUnitContract,
	updateUnitContract,
} from "./unit.contract";

export const contract = {
	unit: {
		create: createUnitContract,
		update: updateUnitContract,
		delete: deleteUnitContract,
		list: listUnitContract,
	},
};
