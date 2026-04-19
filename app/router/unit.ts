import { implement } from "@orpc/server";
import { contract } from "../contract";
import { db } from "@/db/db";
import { unit } from "@/db/schema/unit";
import { and, desc, eq, gt } from "drizzle-orm";
import {
	authMiddleware,
	BaseContext,
	permissionMiddleware,
} from "./middleware";

const os = implement(contract).$context<BaseContext>();

export const createUnit = os.unit.create
	.use(authMiddleware)
	.use(permissionMiddleware({ unit: ["create"] }))
	.handler(async ({ input, errors, context }) => {
		const existing = await db
			.select({
				id: unit.id,
			})
			.from(unit)
			.where(eq(unit.name, input.name));
		if (existing) {
			throw errors.CONFLICT({
				data: {
					field: "name",
					value: input.name,
				},
				cause: "UNIT_ALREADY_EXISTS",
			});
		}

		const data = await db
			.insert(unit)
			.values({
				...input,
				organizationId: "1",
			})
			.returning();

		return data[0];
	});

export const updateUnit = os.unit.update
	.use(authMiddleware)
	.use(permissionMiddleware({ unit: ["update"] }))
	.handler(async ({ input, errors, context }) => {
		const { id, ...updates } = input;

		const data = await db
			.update(unit)
			.set(updates)
			.where(eq(unit.id, id))
			.returning();

		if (!data) {
			throw errors.NOT_FOUND({
				data: {
					resourceId: id,
					resourceType: "Unit",
				},
				cause: "UNIT_NOT_FOUND",
			});
		}

		return data[0];
	});

export const deleteUnit = os.unit.delete
	.use(authMiddleware)
	.use(permissionMiddleware({ unit: ["delete"] }))
	.handler(async ({ input, errors, context }) => {
		const existing = await db.select().from(unit).where(eq(unit.id, input.id));

		if (!existing) {
			throw errors.NOT_FOUND({
				data: {
					resourceId: input.id,
					resourceType: "Unit",
				},
				cause: "UNIT_NOT_FOUND",
			});
		}

		const data = await db
			.update(unit)
			.set({ status: "inactive" })
			.where(eq(unit.id, input.id))
			.returning();

		return data[0];
	});

export const listUnit = os.unit.list
	.use(authMiddleware)
	.use(permissionMiddleware({ unit: ["read"] }))
	.handler(async ({ input }) => {
		const { cursor, limit, status } = input;

		const rows = await db
			.select()
			.from(unit)
			.orderBy(desc(unit.createdAt))
			.where(
				and(
					status ? eq(unit.status, status) : undefined,
					cursor ? gt(unit.id, cursor) : undefined,
				),
			)
			.limit(limit + 1);

		const hasMore = rows.length > limit;
		const items = hasMore ? rows.slice(0, limit) : rows;

		return {
			items,
			nextCursor: hasMore ? items[items.length - 1].id : null,
		};
	});
