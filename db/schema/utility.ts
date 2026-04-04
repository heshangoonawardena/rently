import { relations } from "drizzle-orm";
import {
	pgTable,
	text,
	timestamp,
	numeric,
	date,
	index,
} from "drizzle-orm/pg-core";
import { unit } from "./unit";
import {
	utilityTypeEnum,
	utilityStatusEnum,
	utilityBillStatusEnum,
} from "./enums";

// Represents a physical utility account on a unit (electricity, water account).
// Tied to the unit, not the lease. When a tenant changes and the utility
// account details change, mark the old row inactive and create a new one.
export const utility = pgTable(
	"utility",
	{
		id: text("id").primaryKey(),
		unitId: text("unit_id")
			.notNull()
			.references(() => unit.id, { onDelete: "cascade" }),
		utilityType: utilityTypeEnum("utility_type").notNull(),
		holderName: text("holder_name").notNull(),
		address: text("address"),
		accountNumber: text("account_number").notNull(),
		description: text("description"),
		status: utilityStatusEnum("status").default("active").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("utility_unitId_idx").on(table.unitId),
		index("utilityType_idx").on(table.utilityType),
	],
);

export const utilityBill = pgTable(
	"utility_bill",
	{
		id: text("id").primaryKey(),
		utilityId: text("utility_id")
			.notNull()
			.references(() => utility.id, { onDelete: "restrict" }),
		billAmount: numeric("bill_amount", { precision: 12, scale: 2 }).notNull(),
		previousDueAmount: numeric("previous_due_amount", {
			precision: 12,
			scale: 2,
		})
			.default("0")
			.notNull(),
		periodStart: date("period_start").notNull(),
		periodEnd: date("period_end").notNull(),
		description: text("description"),
		status: utilityBillStatusEnum("status").default("draft").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("utility_bill_utility_id_idx").on(table.utilityId),
		index("utility_bill_period_idx").on(table.periodStart, table.periodEnd),
	],
);

// ============================================================
// RELATIONS
// ============================================================

export const utilityRelations = relations(utility, ({ one, many }) => ({
	unit: one(unit, {
		fields: [utility.unitId],
		references: [unit.id],
	}),
	bills: many(utilityBill),
}));

export const utilityBillRelations = relations(utilityBill, ({ one }) => ({
	utility: one(utility, {
		fields: [utilityBill.utilityId],
		references: [utility.id],
	}),
}));
