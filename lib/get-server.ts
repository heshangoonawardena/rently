import { headers } from "next/headers";
import { auth } from "./auth";

export async function getServerSession() {
	return await auth.api.getSession({ headers: await headers() });
}

export async function getServerRole() {
	return (await auth.api.getActiveMemberRole({ headers: await headers() }))
		.role;
}
