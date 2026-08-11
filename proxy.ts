import { type NextRequest, NextResponse } from "next/server";
import { getServerRole, getServerSession } from "./lib/get-server";

const rolePermissions = {
	owner: {
		default: "/dashboard",
		routes: [
			"/dashboard",
			"/tenants",
			"/leases",
			"/units",
			"/repairs",
			"/payments",
			"/inspections",
			"/users",
			"/settings",
		],
	},

	manager: {
		default: "/dashboard",
		routes: [
			"/dashboard",
			"/tenants",
			"/leases",
			"/units",
			"/repairs",
			"/payments",
			"/inspections",
		],
	},

	tenant: {
		default: "/leases",
		routes: ["/payments", "/repairs", "/leases", "/inspections"],
	},
} as const;

function canAccess(role: keyof typeof rolePermissions, pathname: string) {
	return rolePermissions[role].routes.some(
		(route) => pathname === route || pathname.startsWith(`${route}/`),
	);
}

export async function proxy(request: NextRequest) {
	const pathname = request.nextUrl.pathname;

	const session = await getServerSession();

	if (!session) {
		return NextResponse.redirect(new URL("/login", request.url));
	}

	const role = await getServerRole();

	if (!role || !(role in rolePermissions)) {
		return NextResponse.redirect(new URL("/login", request.url));
	}

	// User has permission
	if (canAccess(role as keyof typeof rolePermissions, pathname)) {
		return NextResponse.next();
	}

	// User tried accessing unauthorized route
	return NextResponse.redirect(
		new URL(
			rolePermissions[role as keyof typeof rolePermissions].default,
			request.url,
		),
	);
}

export const config = {
	matcher: [
		"/dashboard/:path*",
		"/tenants/:path*",
		"/leases/:path*",
		"/units/:path*",
		"/payments/:path*",
		"/repairs/:path*",
		"/users/:path*",
		"/inspections/:path*",
	],
};
