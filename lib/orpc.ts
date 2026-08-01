import type { RouterClient } from "@orpc/server";
import type { JsonifiedClient } from "@orpc/openapi-client";
import { OpenAPILink } from "@orpc/openapi-client/fetch";
import { createORPCClient } from "@orpc/client";
import { contract } from "@/app/contract";
import { router } from "@/app/router";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { ContractRouterClient } from "@orpc/contract";
import { ResponseValidationPlugin } from "@orpc/contract/plugins";

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
