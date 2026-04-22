import { implement } from "@orpc/server";
import { contract } from "../contract";
import { BaseContext } from "./middleware";
import { createUnit, deleteUnit, getUnit, listUnit, updateUnit } from "./unit";
import {
	createTenant,
	deleteTenant,
	getTenant,
	listTenant,
	updateTenant,
	createTenantOccupant,
	updateTenantOccupant,
	deleteTenantOccupant,
	listTenantOccupant,
} from "./tenant";
import {
	createLease,
	getLease,
	listLease,
	listLeaseRent,
	terminateLease,
	updateLease,
	deleteLeaseRent,
	createLeaseRent,
	updateLeaseRent,
} from "./lease";
import { terminateLeaseContract } from "../contract/lease.contract";

const os = implement(contract).$context<BaseContext>();

export const router = os.router({
	unit: {
		create: createUnit,
		update: updateUnit,
		delete: deleteUnit,
		get: getUnit,
		list: listUnit,
	},
	tenant: {
		create: createTenant,
		update: updateTenant,
		delete: deleteTenant,
		get: getTenant,
		list: listTenant,
		createOccupant: createTenantOccupant,
		updateOccupant: updateTenantOccupant,
		deleteOccupant: deleteTenantOccupant,
		listOccupants: listTenantOccupant,
	},
	lease: {
		create: createLease,
		update: updateLease,
		terminate: terminateLease,
		get: getLease,
		list: listLease,
		createRent: createLeaseRent,
		updateRent: updateLeaseRent,
		deleteRent: deleteLeaseRent,
		listRents: listLeaseRent,
	},
});
