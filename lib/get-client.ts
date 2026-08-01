import { authClient } from "./auth-client";

export function getClientSession() {
	return authClient.useSession();
}

export async function getClientActiveMember() {
	return await authClient.organization.getActiveMemberRole();
}
