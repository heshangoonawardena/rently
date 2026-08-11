import { createORPCClient } from "@orpc/client";
import type { ContractRouterClient } from "@orpc/contract";
import { OpenAPILink } from "@orpc/openapi-client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { contract } from "@/app/contract";
import type { router } from "@/app/router";

declare global {
	var $client: ContractRouterClient<typeof router> | undefined;
}

const link = new OpenAPILink(contract, {
	url: () => {
		if (typeof window === "undefined") {
			throw new Error("OpenAPILink is not allowed on the server side.");
		}

		return `${window.location.origin}/api`;
	},
	// plugins: [new ResponseValidationPlugin(contract)],
});

/**
 * Fallback to client-side client if server-side client is not available.
 */

export const client: ContractRouterClient<typeof router> =
	globalThis.$client ?? createORPCClient(link);

export const orpc = createTanstackQueryUtils(client);
