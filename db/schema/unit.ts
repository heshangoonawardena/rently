import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, index, serial } from "drizzle-orm/pg-core";
import { organization } from "./auth";
import { unitTypeEnum, unitStatusEnum, utilityBillingModeEnum } from "./enums";
import {
	createInsertSchema,
	createSelectSchema,
	createUpdateSchema,
} from "drizzle-zod";
import z from "zod";

export const unit = pgTable(
	"unit",
	{
		id: serial("id").primaryKey(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		type: unitTypeEnum("type").notNull(),
		address: text("address").notNull(),
		description: text("description"),
		utilityBillingMode: utilityBillingModeEnum(
			"utility_billing_mode",
		).notNull(),
		status: unitStatusEnum("status").default("available").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [index("unit_orgId_idx").on(table.organizationId)],
);

export const selectUnitSchema = createSelectSchema(unit);
export type Unit = z.infer<typeof selectUnitSchema>;

export const insertUnitSchema = createInsertSchema(unit);
export type InsertUnit = z.infer<typeof insertUnitSchema>;

export const updateUnitSchema = createUpdateSchema(unit);
export type UpdateUnit = z.infer<typeof updateUnitSchema>;

// ============================================================
// RELATIONS
// ============================================================

export const unitRelations = relations(unit, ({ one, many }) => ({
	organization: one(organization, {
		fields: [unit.organizationId],
		references: [organization.id],
	}),

	leases: many(lease),
	utilities: many(utility),
	repairRequests: many(repairRequest),
	inspections: many(inspection),
	documents: many(unitDocument),
}));

// Lazy imports to avoid circular dependency — resolved at runtime by Drizzle.
import { lease } from "./lease";
import { utility } from "./utility";
import { repairRequest } from "./repair";
import { inspection } from "./inspection";
import { unitDocument } from "./document";
