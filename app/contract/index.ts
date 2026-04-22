import {
	createLeaseContract,
	createLeaseRentContract,
	deleteLeaseRentContract,
	getLeaseContract,
	listLeaseContract,
	listLeaseRentContract,
	terminateLeaseContract,
	updateLeaseContract,
	updateLeaseRentContract,
} from "./lease.contract";
import {
	createTenantContract,
	deleteTenantContract,
	getTenantContract,
	listTenantContract,
	updateTenantContract,
	createTenantOccupantContract,
	updateTenantOccupantContract,
	deleteTenantOccupantContract,
	listTenantOccupantContract,
} from "./tenant.contract";
import {
	createUnitContract,
	deleteUnitContract,
	getUnitContract,
	listUnitContract,
	updateUnitContract,
} from "./unit.contract";

export const contract = {
	unit: {
		create: createUnitContract,
		update: updateUnitContract,
		delete: deleteUnitContract,
		get: getUnitContract,
		list: listUnitContract,
	},
	tenant: {
		create: createTenantContract,
		update: updateTenantContract,
		delete: deleteTenantContract,
		get: getTenantContract,
		list: listTenantContract,
		createOccupant: createTenantOccupantContract,
		updateOccupant: updateTenantOccupantContract,
		deleteOccupant: deleteTenantOccupantContract,
		listOccupants: listTenantOccupantContract,
	},
	lease: {
		create: createLeaseContract,
		update: updateLeaseContract,
		terminate: terminateLeaseContract,
		get: getLeaseContract,
		list: listLeaseContract,
		createRent: createLeaseRentContract,
		updateRent: updateLeaseRentContract,
		deleteRent: deleteLeaseRentContract,
		listRents: listLeaseRentContract,
	},
};
