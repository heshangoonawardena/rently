import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";
import { ac, owner, manager, tenant } from "./auth/permissions";

export const authClient = createAuthClient({
	baseURL: "http://localhost:3000",
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
