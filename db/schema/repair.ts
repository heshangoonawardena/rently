import { relations } from "drizzle-orm";
import {
	index,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
} from "drizzle-orm/pg-core";
import {
	createInsertSchema,
	createSelectSchema,
	createUpdateSchema,
} from "drizzle-zod";
import type z from "zod";
import { user } from "./auth";
import { repairPriorityEnum, repairStatusEnum, repairTypeEnum } from "./enums";
import { unit } from "./unit";

export const repairRequest = pgTable(
	"repair_request",
	{
		id: serial("id").primaryKey(),
		unitId: integer("unit_id")
			.notNull()
			.references(() => unit.id, { onDelete: "restrict" }),
		// Any logged-in user can raise a repair — tenant, manager, or owner
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "restrict" }),
		repairType: repairTypeEnum("repair_type").notNull(),
		title: text("title").notNull(),
		description: text("description"),
		priority: repairPriorityEnum("priority").default("medium").notNull(),
		status: repairStatusEnum("status").default("open").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("repair_request_unitId_idx").on(table.unitId),
		index("repair_request_userId_idx").on(table.userId),
		index("repair_request_status_idx").on(table.status),
	],
);

// Append-only event log — never update or delete rows.
// Every status change and note is a new row here.
export const repairUpdate = pgTable(
	"repair_update",
	{
		id: serial("id").primaryKey(),
		repairRequestId: integer("repair_request_id")
			.notNull()
			.references(() => repairRequest.id, { onDelete: "cascade" }),
		// Who made this update (manager or owner)
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "restrict" }),
		oldStatus: repairStatusEnum("old_status").notNull(),
		newStatus: repairStatusEnum("new_status").notNull(),
		description: text("description"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("repair_update_requestId_idx").on(table.repairRequestId),
		index("repair_update_userId_idx").on(table.userId),
	],
);

// repair request schema
export const selectRepairRequestSchema = createSelectSchema(repairRequest);
export type RepairRequestType = z.infer<typeof selectRepairRequestSchema>;

export const insertRepairRequestSchema = createInsertSchema(repairRequest);
export type InsertRepairRequestType = z.infer<typeof insertRepairRequestSchema>;

export const updateRepairRequestSchema = createUpdateSchema(repairRequest);
export type UpdateRepairRequestType = z.infer<typeof updateRepairRequestSchema>;

// repair update schema
export const selectRepairUpdateSchema = createSelectSchema(repairUpdate);
export type RepairUpdateType = z.infer<typeof selectRepairUpdateSchema>;

export const insertRepairUpdateSchema = createInsertSchema(repairUpdate);
export type InsertRepairUpdateType = z.infer<typeof insertRepairUpdateSchema>;

export const updateRepairUpdateSchema = createUpdateSchema(repairUpdate);
export type UpdateRepairUpdateType = z.infer<typeof updateRepairUpdateSchema>;

// ============================================================
// RELATIONS
// ============================================================

export const repairRequestRelations = relations(
	repairRequest,
	({ one, many }) => ({
		unit: one(unit, {
			fields: [repairRequest.unitId],
			references: [unit.id],
		}),
		user: one(user, {
			fields: [repairRequest.userId],
			references: [user.id],
		}),
		updates: many(repairUpdate),
	}),
);

export const repairUpdateRelations = relations(repairUpdate, ({ one }) => ({
	repairRequest: one(repairRequest, {
		fields: [repairUpdate.repairRequestId],
		references: [repairRequest.id],
	}),
	user: one(user, {
		fields: [repairUpdate.userId],
		references: [user.id],
	}),
}));
