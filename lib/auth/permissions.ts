import { createAccessControl } from "better-auth/plugins/access";

const statement = {
	unit: ["create", "read", "update", "delete"],
	tenant: ["create", "read", "update", "delete"],
	lease: ["create", "read", "update", "delete"],
	payment: ["create", "read", "update", "delete"],
	utility: ["create", "read", "update", "delete"],
	repair: ["create", "read", "update", "resolve", "delete"],
	inspection: ["create", "read", "update", "delete"],
	document: ["create", "read", "update", "delete"],
	member: ["invite", "read", "update-role", "remove"],
	organization: ["read", "update", "delete"],
} as const;

const ac = createAccessControl(statement);

const owner = ac.newRole({
	unit: ["create", "read", "update", "delete"],
	tenant: ["create", "read", "update", "delete"],
	lease: ["create", "read", "update", "delete"],
	payment: ["create", "read", "update", "delete"],
	utility: ["create", "read", "update", "delete"],
	repair: ["create", "read", "update", "resolve", "delete"],
	inspection: ["create", "read", "update", "delete"],
	document: ["create", "read", "update", "delete"],
	member: ["invite", "read", "update-role", "remove"],
	organization: ["read", "update", "delete"],
});

const manager = ac.newRole({
	unit: ["read", "update"],
	tenant: ["create", "read", "update"],
	lease: ["create", "read", "update"],
	payment: ["create", "read"],
	utility: ["create", "read", "update"],
	repair: ["create", "read", "update", "resolve"],
	inspection: ["create", "read", "update"],
	document: ["create", "read", "update"],
	member: ["invite", "read"],
	organization: ["read"],
});

const tenant = ac.newRole({
	unit: ["read"],
	lease: ["read"],
	payment: ["read"],
	utility: ["read"],
	repair: ["create", "read"],
	inspection: ["read"],
	document: ["read"],
	organization: ["read"],
});

export { owner, manager, tenant, ac, statement };
