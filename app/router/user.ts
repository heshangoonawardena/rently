import { implement } from "@orpc/server";
import {
	and,
	desc,
	eq,
	ilike,
	inArray,
	isNull,
	max,
	notExists,
	or,
} from "drizzle-orm";
import { db } from "@/db/db";
import { account, member, session, user } from "@/db/schema/auth";
import { inspection } from "@/db/schema/inspection";
import { leaseSettlement } from "@/db/schema/lease";
import { repairRequest, repairUpdate } from "@/db/schema/repair";
import { tenant } from "@/db/schema/tenant";
import { contract } from "../contract";
import {
	authMiddleware,
	type BaseContext,
	permissionMiddleware,
} from "./middleware";

const os = implement(contract).$context<BaseContext>();

const searchableUserWhere = (search?: string) => {
	if (!search?.trim()) {
		return undefined;
	}

	return or(ilike(user.name, `%${search}%`), ilike(user.email, `%${search}%`));
};

const countOwnersInOrganization = async (organizationId: string) => {
	const owners = await db
		.select({ id: member.id })
		.from(member)
		.where(
			and(eq(member.organizationId, organizationId), eq(member.role, "owner")),
		);

	return owners.length;
};

const getLinkedTenantByUserId = async (
	organizationId: string,
	userId: string,
) => {
	const [linkedTenant] = await db
		.select({
			id: tenant.id,
			firstName: tenant.firstName,
			lastName: tenant.lastName,
		})
		.from(tenant)
		.where(
			and(eq(tenant.organizationId, organizationId), eq(tenant.userId, userId)),
		)
		.limit(1);

	return linkedTenant ?? null;
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

		const approvedUserIds = approvedRows.map((row) => row.id);
		const sessionRows =
			approvedUserIds.length > 0
				? await db
						.select({
							userId: session.userId,
							lastLoggedInAt: max(session.createdAt),
						})
						.from(session)
						.where(inArray(session.userId, approvedUserIds))
						.groupBy(session.userId)
				: [];
		const lastLoginByUserId = new Map(
			sessionRows.map((row) => [row.userId, row.lastLoggedInAt ?? null]),
		);

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
			lastLoggedInAt: lastLoginByUserId.get(row.id) ?? null,
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
			lastLoggedInAt: null,
		}));

		return {
			items: [...approved, ...pending].sort(
				(a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
			),
		};
	});

export const getMyUserProfile = os.user.me
	.use(authMiddleware)
	.handler(async ({ context, errors }) => {
		const { userId } = context.user;

		const [profile] = await db
			.select({
				id: user.id,
				name: user.name,
			})
			.from(user)
			.where(eq(user.id, userId))
			.limit(1);

		if (!profile) {
			throw errors.NOT_FOUND({
				data: {
					resourceType: "User",
					resourceId: userId,
				},
				message: "User Not Found",
			});
		}

		return {
			id: profile.id,
			name: profile.name,
		};
	});

export const updateMyUserProfile = os.user.updateMe
	.use(authMiddleware)
	.handler(async ({ context, input, errors }) => {
		const { userId } = context.user;

		const [existingUser] = await db
			.select({ id: user.id })
			.from(user)
			.where(eq(user.id, userId))
			.limit(1);

		if (!existingUser) {
			throw errors.NOT_FOUND({
				data: {
					resourceType: "User",
					resourceId: userId,
				},
				message: "User Not Found",
			});
		}

		const [updated] = await db
			.update(user)
			.set({
				name: input.name,
			})
			.where(eq(user.id, userId))
			.returning({
				id: user.id,
				name: user.name,
			});

		return {
			id: updated.id,
			name: updated.name,
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
		const linkedTenant = await getLinkedTenantByUserId(organizationId, userId);

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
				and(
					eq(member.userId, userId),
					eq(member.organizationId, organizationId),
				),
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

		if (role === "owner") {
			const ownerCount = await countOwnersInOrganization(organizationId);

			if (ownerCount >= 2) {
				throw errors.DOMAIN_RULE_VIOLATION({
					data: { rule: "OWNER_LIMIT_REACHED" },
					message: "A maximum of 2 owners are allowed",
				});
			}

			if (linkedTenant) {
				throw errors.DOMAIN_RULE_VIOLATION({
					data: { rule: "TENANT_CANNOT_BE_OWNER" },
					message: "Ownership cannot be delegated to a tenant-linked account",
				});
			}
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

				if (linkedTenant && linkedTenant.id !== tenantId) {
					throw errors.CONFLICT({
						data: {
							field: "userId",
							value: userId,
						},
						message: "User is already linked to another tenant",
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

				await tx.update(tenant).set({ userId }).where(eq(tenant.id, tenantId));

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
			lastLoggedInAt: null,
		};
	});

export const updateUserRole = os.user.updateRole
	.use(authMiddleware)
	.use(permissionMiddleware({ member: ["update-role"] }))
	.handler(async ({ input, errors, context }) => {
		const { organizationId, userId: actorUserId } = context.user;
		const { userId, role, tenantId } = input;
		const linkedTenant = await getLinkedTenantByUserId(organizationId, userId);

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
				and(
					eq(member.userId, userId),
					eq(member.organizationId, organizationId),
				),
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

		if (
			membership.role === "owner" &&
			userId === actorUserId &&
			role !== "owner"
		) {
			throw errors.DOMAIN_RULE_VIOLATION({
				data: { rule: "SELF_OWNER_ROLE_CHANGE_BLOCKED" },
				message: "Current owner cannot change their own owner role",
			});
		}

		if (membership.role === "owner" && role !== "owner") {
			const ownerCount = await countOwnersInOrganization(organizationId);

			if (ownerCount <= 1) {
				throw errors.DOMAIN_RULE_VIOLATION({
					data: { rule: "LAST_OWNER_ROLE_CHANGE_BLOCKED" },
					message: "At least one owner must remain in the organization",
				});
			}
		}

		if (membership.role === "owner" && role === "tenant") {
			throw errors.DOMAIN_RULE_VIOLATION({
				data: { rule: "OWNER_TO_TENANT_ROLE_CHANGE_BLOCKED" },
				message: "Owner role cannot be delegated directly to a tenant role",
			});
		}

		if (role === "owner" && membership.role !== "owner") {
			const ownerCount = await countOwnersInOrganization(organizationId);

			if (ownerCount >= 2) {
				throw errors.DOMAIN_RULE_VIOLATION({
					data: { rule: "OWNER_LIMIT_REACHED" },
					message: "A maximum of 2 owners are allowed",
				});
			}

			if (membership.role === "tenant") {
				throw errors.DOMAIN_RULE_VIOLATION({
					data: { rule: "TENANT_CANNOT_BE_OWNER" },
					message: "Ownership cannot be delegated to a tenant-linked account",
				});
			}

			if (linkedTenant) {
				throw errors.DOMAIN_RULE_VIOLATION({
					data: { rule: "TENANT_CANNOT_BE_OWNER" },
					message: "Ownership cannot be delegated to a tenant-linked account",
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

				if (linkedTenant && linkedTenant.id !== tenantId) {
					throw errors.CONFLICT({
						data: {
							field: "userId",
							value: userId,
						},
						message: "User is already linked to another tenant",
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

				await tx.update(tenant).set({ userId }).where(eq(tenant.id, tenantId));

				linkedTenantId = selectedTenant.id;
				linkedTenantName =
					`${selectedTenant.firstName} ${selectedTenant.lastName ?? ""}`.trim();
			} else {
				linkedTenantId = null;
				linkedTenantName = null;
			}

			await tx.update(member).set({ role }).where(eq(member.id, membership.id));
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
			lastLoggedInAt: null,
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
			const ownerCount = await countOwnersInOrganization(organizationId);

			if (ownerCount <= 1) {
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
			lastLoggedInAt: null,
		};
	});

export const deleteUserAccount = os.user.delete
	.use(authMiddleware)
	.use(permissionMiddleware({ member: ["remove"] }))
	.handler(async ({ input, errors, context }) => {
		const { organizationId, userId: actorUserId } = context.user;

		const [targetUser] = await db
			.select({ id: user.id, name: user.name })
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

		if (input.userId === actorUserId) {
			throw errors.DOMAIN_RULE_VIOLATION({
				data: { rule: "SELF_DELETE_BLOCKED" },
				message: "You cannot delete your own account",
			});
		}

		const [membership] = await db
			.select({ role: member.role })
			.from(member)
			.where(
				and(
					eq(member.userId, input.userId),
					eq(member.organizationId, organizationId),
				),
			)
			.limit(1);

		if (membership?.role === "owner") {
			const ownerCount = await countOwnersInOrganization(organizationId);

			if (ownerCount <= 1) {
				throw errors.DOMAIN_RULE_VIOLATION({
					data: { rule: "LAST_OWNER_DELETE_BLOCKED" },
					message: "Cannot delete the last remaining owner",
				});
			}
		}

		const [
			repairRequestReference,
			repairUpdateReference,
			inspectionReference,
			leaseSettlementReference,
		] = await Promise.all([
			db
				.select({ id: repairRequest.id })
				.from(repairRequest)
				.where(eq(repairRequest.userId, input.userId))
				.limit(1),
			db
				.select({ id: repairUpdate.id })
				.from(repairUpdate)
				.where(eq(repairUpdate.userId, input.userId))
				.limit(1),
			db
				.select({ id: inspection.id })
				.from(inspection)
				.where(eq(inspection.userId, input.userId))
				.limit(1),
			db
				.select({ id: leaseSettlement.id })
				.from(leaseSettlement)
				.where(eq(leaseSettlement.createdBy, input.userId))
				.limit(1),
		]);

		const hasProtectedReferences =
			repairRequestReference.length > 0 ||
			repairUpdateReference.length > 0 ||
			inspectionReference.length > 0 ||
			leaseSettlementReference.length > 0;

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

			if (!hasProtectedReferences) {
				await tx.delete(user).where(eq(user.id, input.userId));
				return;
			}

			await tx
				.delete(member)
				.where(
					and(
						eq(member.userId, input.userId),
						eq(member.organizationId, organizationId),
					),
				);

			await tx.delete(session).where(eq(session.userId, input.userId));
			await tx.delete(account).where(eq(account.userId, input.userId));

			await tx
				.update(user)
				.set({
					name: `${targetUser.name} (deactivated)`,
					email: `deleted+${targetUser.id}@rently.local`,
					image: null,
				})
				.where(eq(user.id, input.userId));
		});

		return {
			id: targetUser.id,
			name: targetUser.name,
			deleted: true as const,
		};
	});
