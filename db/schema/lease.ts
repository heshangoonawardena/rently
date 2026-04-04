import { relations } from "drizzle-orm";
import {
	pgTable,
	text,
	timestamp,
	numeric,
	date,
	index,
	uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { unit } from "./unit";
import { tenant } from "./tenant";
import { leaseStatusEnum } from "./enums";

export const lease = pgTable(
	"lease",
	{
		id: text("id").primaryKey(),
		unitId: text("unit_id")
			.notNull()
			.references(() => unit.id, { onDelete: "restrict" }),
		tenantId: text("tenant_id")
			.notNull()
			.references(() => tenant.id, { onDelete: "restrict" }),
		startDate: date("start_date").notNull(),
		endDate: date("end_date"),
		// Agreed deposit at signing. Actual deposit balance is derived
		// from the payment table (sum of deposit_deduction payments).
		depositAmount: numeric("deposit_amount", {
			precision: 12,
			scale: 2,
		}).notNull(),
		status: leaseStatusEnum("status").default("active").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("lease_unitId_idx").on(table.unitId),
		index("lease_tenantId_idx").on(table.tenantId),
		// Enforce one active lease per unit at DB level
		uniqueIndex("lease_unit_active_unique_idx")
			.on(table.unitId)
			.where(sql`status = 'active'`),
	],
);

// Always seed one row at lease creation with effectiveDate = lease.startDate.
// Query pattern for current rent:
//   SELECT * FROM lease_rent
//   WHERE lease_id = $1 AND effective_date <= $2
//   ORDER BY effective_date DESC LIMIT 1
export const leaseRent = pgTable(
	"lease_rent",
	{
		id: text("id").primaryKey(),
		leaseId: text("lease_id")
			.notNull()
			.references(() => lease.id, { onDelete: "cascade" }),
		rentAmount: numeric("rent_amount", { precision: 12, scale: 2 }).notNull(),
		effectiveDate: date("effective_date").notNull(),
		description: text("description"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("lease_rent_leaseId_idx").on(table.leaseId),
		index("lease_rent_effectiveDate_idx").on(table.effectiveDate),
	],
);

// ============================================================
// RELATIONS
// ============================================================

export const leaseRelations = relations(lease, ({ one, many }) => ({
	unit: one(unit, {
		fields: [lease.unitId],
		references: [unit.id],
	}),
	tenant: one(tenant, {
		fields: [lease.tenantId],
		references: [tenant.id],
	}),
	rentSchedule: many(leaseRent),
	payments: many(payment),
	documents: many(leaseDocument),
}));

export const leaseRentRelations = relations(leaseRent, ({ one }) => ({
	lease: one(lease, {
		fields: [leaseRent.leaseId],
		references: [lease.id],
	}),
}));

import { payment } from "./payment";
import { leaseDocument } from "./document";
