import { implement } from "@orpc/server";
import { contract } from "../contract";
import { db } from "@/db/db";
import {
	and,
	desc,
	eq,
	ilike,
	inArray,
	isNull,
	notExists,
	or,
} from "drizzle-orm";
import {
	authMiddleware,
	BaseContext,
	permissionMiddleware,
} from "./middleware";
import { member, user } from "@/db/schema/auth";
import { tenant } from "@/db/schema/tenant";

const os = implement(contract).$context<BaseContext>();

const searchableUserWhere = (search?: string) => {
	if (!search?.trim()) {
		return undefined;
	}

	return or(ilike(user.name, `%${search}%`), ilike(user.email, `%${search}%`));
};

export const listUsers = os.user.list
	.use(authMiddleware)
	.use(permissionMiddleware({ member: ["read"] }))
	.handler(async ({ input, context }) => {
		const { organizationId } = context.user;
		const searchFilter = searchableUserWhere(input.search);

		const approvedRows = await db
			.select({
				id: user.id,
				name: user.name,
				email: user.email,
				emailVerified: user.emailVerified,
				image: user.image,
				createdAt: user.createdAt,
				updatedAt: user.updatedAt,
				role: member.role,
				tenantId: tenant.id,
				tenantFirstName: tenant.firstName,
				tenantLastName: tenant.lastName,
			})
			.from(member)
			.innerJoin(user, eq(user.id, member.userId))
			.leftJoin(
				tenant,
				and(
					eq(tenant.userId, user.id),
					eq(tenant.organizationId, organizationId),
				),
			)
			.where(and(eq(member.organizationId, organizationId), searchFilter))
			.orderBy(desc(user.updatedAt));

		const pendingRows = await db
			.select({
				id: user.id,
				name: user.name,
				email: user.email,
				emailVerified: user.emailVerified,
				image: user.image,
				createdAt: user.createdAt,
				updatedAt: user.updatedAt,
			})
			.from(user)
			.where(
				and(
					searchFilter,
					notExists(
						db
							.select({ id: member.id })
							.from(member)
							.where(
								and(
									eq(member.userId, user.id),
									eq(member.organizationId, organizationId),
								),
							),
					),
				),
			)
			.orderBy(desc(user.updatedAt));

		const approved = approvedRows.map((row) => ({
			id: row.id,
			name: row.name,
			email: row.email,
			emailVerified: row.emailVerified,
			image: row.image,
			createdAt: row.createdAt,
			updatedAt: row.updatedAt,
			role: (row.role as "owner" | "manager" | "tenant") ?? null,
			approvalStatus: "approved" as const,
			tenantId: row.tenantId ?? null,
			tenantName:
				row.tenantId && row.tenantFirstName
					? `${row.tenantFirstName} ${row.tenantLastName ?? ""}`.trim()
					: null,
		}));

		const pending = pendingRows.map((row) => ({
			id: row.id,
			name: row.name,
			email: row.email,
			emailVerified: row.emailVerified,
			image: row.image,
			createdAt: row.createdAt,
			updatedAt: row.updatedAt,
			role: null,
			approvalStatus: "pending_approval" as const,
			tenantId: null,
			tenantName: null,
		}));

		return {
			items: [...approved, ...pending].sort(
				(a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
			),
		};
	});

export const listAvailableTenantsForApproval = os.user.listAvailableTenants
	.use(authMiddleware)
	.use(permissionMiddleware({ member: ["read"] }))
	.handler(async ({ context }) => {
		const { organizationId } = context.user;

		const items = await db
			.select({
				id: tenant.id,
				firstName: tenant.firstName,
				lastName: tenant.lastName,
				nic: tenant.nic,
				status: tenant.status,
			})
			.from(tenant)
			.where(
				and(
					eq(tenant.organizationId, organizationId),
					isNull(tenant.userId),
					inArray(tenant.status, ["active", "pending"]),
				),
			)
			.orderBy(desc(tenant.updatedAt));

		return { items };
	});

export const approveUser = os.user.approve
	.use(authMiddleware)
	.use(permissionMiddleware({ member: ["update-role"] }))
	.handler(async ({ input, errors, context }) => {
		const { organizationId } = context.user;
		const { userId, role, tenantId } = input;

		const [targetUser] = await db
			.select()
			.from(user)
			.where(eq(user.id, userId))
			.limit(1);

		if (!targetUser) {
			throw errors.NOT_FOUND({
				data: {
					resourceType: "User",
					resourceId: userId,
				},
				message: "User Not Found",
			});
		}

		const [existingMembership] = await db
			.select({ id: member.id })
			.from(member)
			.where(
				and(eq(member.userId, userId), eq(member.organizationId, organizationId)),
			)
			.limit(1);

		if (existingMembership) {
			throw errors.CONFLICT({
				data: {
					field: "userId",
					value: userId,
				},
				message: "User is already approved for this organization",
			});
		}

		let linkedTenantId: number | null = null;
		let linkedTenantName: string | null = null;

		await db.transaction(async (tx) => {
			await tx.insert(member).values({
				id: crypto.randomUUID(),
				organizationId,
				userId,
				role,
				createdAt: new Date(),
			});

			if (role === "tenant") {
				if (!tenantId) {
					throw errors.DOMAIN_RULE_VIOLATION({
						data: { rule: "TENANT_ASSIGNMENT_REQUIRED" },
						message: "Tenant role requires a tenant assignment",
					});
				}

				const [selectedTenant] = await tx
					.select({
						id: tenant.id,
						firstName: tenant.firstName,
						lastName: tenant.lastName,
						userId: tenant.userId,
					})
					.from(tenant)
					.where(
						and(
							eq(tenant.id, tenantId),
							eq(tenant.organizationId, organizationId),
						),
					)
					.limit(1);

				if (!selectedTenant) {
					throw errors.NOT_FOUND({
						data: {
							resourceType: "Tenant",
							resourceId: String(tenantId),
						},
						message: "Tenant Not Found",
					});
				}

				if (selectedTenant.userId && selectedTenant.userId !== userId) {
					throw errors.CONFLICT({
						data: {
							field: "tenantId",
							value: String(tenantId),
						},
						message: "Tenant already has a linked portal user",
					});
				}

				await tx
					.update(tenant)
					.set({ userId })
					.where(eq(tenant.id, tenantId));

				linkedTenantId = selectedTenant.id;
				linkedTenantName =
					`${selectedTenant.firstName} ${selectedTenant.lastName ?? ""}`.trim();
			}
		});

		return {
			id: targetUser.id,
			name: targetUser.name,
			email: targetUser.email,
			emailVerified: targetUser.emailVerified,
			image: targetUser.image,
			createdAt: targetUser.createdAt,
			updatedAt: targetUser.updatedAt,
			role,
			approvalStatus: "approved" as const,
			tenantId: linkedTenantId,
			tenantName: linkedTenantName,
		};
	});

export const updateUserRole = os.user.updateRole
	.use(authMiddleware)
	.use(permissionMiddleware({ member: ["update-role"] }))
	.handler(async ({ input, errors, context }) => {
		const { organizationId } = context.user;
		const { userId, role, tenantId } = input;

		const [targetUser] = await db
			.select()
			.from(user)
			.where(eq(user.id, userId))
			.limit(1);

		if (!targetUser) {
			throw errors.NOT_FOUND({
				data: {
					resourceType: "User",
					resourceId: userId,
				},
				message: "User Not Found",
			});
		}

		const [membership] = await db
			.select({ id: member.id, role: member.role })
			.from(member)
			.where(
				and(eq(member.userId, userId), eq(member.organizationId, organizationId)),
			)
			.limit(1);

		if (!membership) {
			throw errors.NOT_FOUND({
				data: {
					resourceType: "Member",
					resourceId: userId,
				},
				message: "User is not approved for this organization",
			});
		}

		if (membership.role === "owner" && role !== "owner") {
			const owners = await db
				.select({ id: member.id })
				.from(member)
				.where(
					and(
						eq(member.organizationId, organizationId),
						eq(member.role, "owner"),
					),
				);

			if (owners.length <= 1) {
				throw errors.DOMAIN_RULE_VIOLATION({
					data: { rule: "LAST_OWNER_ROLE_CHANGE_BLOCKED" },
					message: "At least one owner must remain in the organization",
				});
			}
		}

		let linkedTenantId: number | null = null;
		let linkedTenantName: string | null = null;

		await db.transaction(async (tx) => {
			if (membership.role === "tenant") {
				await tx
					.update(tenant)
					.set({ userId: null })
					.where(
						and(
							eq(tenant.organizationId, organizationId),
							eq(tenant.userId, userId),
						),
					);
			}

			if (role === "tenant") {
				if (!tenantId) {
					throw errors.DOMAIN_RULE_VIOLATION({
						data: { rule: "TENANT_ASSIGNMENT_REQUIRED" },
						message: "Tenant role requires a tenant assignment",
					});
				}

				const [selectedTenant] = await tx
					.select({
						id: tenant.id,
						firstName: tenant.firstName,
						lastName: tenant.lastName,
						userId: tenant.userId,
					})
					.from(tenant)
					.where(
						and(
							eq(tenant.id, tenantId),
							eq(tenant.organizationId, organizationId),
						),
					)
					.limit(1);

				if (!selectedTenant) {
					throw errors.NOT_FOUND({
						data: {
							resourceType: "Tenant",
							resourceId: String(tenantId),
						},
						message: "Tenant Not Found",
					});
				}

				if (selectedTenant.userId && selectedTenant.userId !== userId) {
					throw errors.CONFLICT({
						data: {
							field: "tenantId",
							value: String(tenantId),
						},
						message: "Tenant already has a linked portal user",
					});
				}

				await tx
					.update(tenant)
					.set({ userId })
					.where(eq(tenant.id, tenantId));

				linkedTenantId = selectedTenant.id;
				linkedTenantName =
					`${selectedTenant.firstName} ${selectedTenant.lastName ?? ""}`.trim();
			} else {
				linkedTenantId = null;
				linkedTenantName = null;
			}

			await tx
				.update(member)
				.set({ role })
				.where(eq(member.id, membership.id));
		});

		return {
			id: targetUser.id,
			name: targetUser.name,
			email: targetUser.email,
			emailVerified: targetUser.emailVerified,
			image: targetUser.image,
			createdAt: targetUser.createdAt,
			updatedAt: targetUser.updatedAt,
			role,
			approvalStatus: "approved" as const,
			tenantId: linkedTenantId,
			tenantName: linkedTenantName,
		};
	});

export const revokeUserAccess = os.user.revokeAccess
	.use(authMiddleware)
	.use(permissionMiddleware({ member: ["remove"] }))
	.handler(async ({ input, errors, context }) => {
		const { organizationId, userId: actorUserId } = context.user;

		const [targetUser] = await db
			.select()
			.from(user)
			.where(eq(user.id, input.userId))
			.limit(1);

		if (!targetUser) {
			throw errors.NOT_FOUND({
				data: {
					resourceType: "User",
					resourceId: input.userId,
				},
				message: "User Not Found",
			});
		}

		const [membership] = await db
			.select({ id: member.id, role: member.role })
			.from(member)
			.where(
				and(
					eq(member.userId, input.userId),
					eq(member.organizationId, organizationId),
				),
			)
			.limit(1);

		if (!membership) {
			throw errors.NOT_FOUND({
				data: {
					resourceType: "Member",
					resourceId: input.userId,
				},
				message: "User is not approved for this organization",
			});
		}

		if (membership.role === "owner") {
			const owners = await db
				.select({ id: member.id })
				.from(member)
				.where(
					and(
						eq(member.organizationId, organizationId),
						eq(member.role, "owner"),
					),
				);

			if (owners.length <= 1) {
				throw errors.DOMAIN_RULE_VIOLATION({
					data: { rule: "LAST_OWNER_REMOVAL_BLOCKED" },
					message: "Cannot revoke access for the last remaining owner",
				});
			}
		}

		if (input.userId === actorUserId) {
			throw errors.DOMAIN_RULE_VIOLATION({
				data: { rule: "SELF_REVOCATION_BLOCKED" },
				message: "You cannot revoke your own organization access",
			});
		}

		await db.transaction(async (tx) => {
			await tx
				.update(tenant)
				.set({ userId: null })
				.where(
					and(
						eq(tenant.organizationId, organizationId),
						eq(tenant.userId, input.userId),
					),
				);

			await tx.delete(member).where(eq(member.id, membership.id));
		});

		return {
			id: targetUser.id,
			name: targetUser.name,
			email: targetUser.email,
			emailVerified: targetUser.emailVerified,
			image: targetUser.image,
			createdAt: targetUser.createdAt,
			updatedAt: targetUser.updatedAt,
			role: null,
			approvalStatus: "pending_approval" as const,
			tenantId: null,
			tenantName: null,
		};
	});
