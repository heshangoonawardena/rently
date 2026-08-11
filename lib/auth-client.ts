import { organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { ac, manager, owner, tenant } from "./auth/permissions";

export const authClient = createAuthClient({
	plugins: [
		organizationClient({
			ac,
			roles: {
				owner,
				manager,
				tenant,
			},
		}),
	],
});
