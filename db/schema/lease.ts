import { relations, sql } from "drizzle-orm";
import {
	date,
	index,
	integer,
	numeric,
	pgTable,
	serial,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";
import {
	createInsertSchema,
	createSelectSchema,
	createUpdateSchema,
} from "drizzle-zod";
import type z from "zod";
import { user } from "./auth";
import {
	leaseRentStatusEnum,
	leaseSettlementExpenseCategoryEnum,
	leaseStatusEnum,
} from "./enums";
import { tenant } from "./tenant";
import { unit } from "./unit";

export const lease = pgTable(
	"lease",
	{
		id: serial("id").primaryKey(),
		unitId: integer("unit_id")
			.notNull()
			.references(() => unit.id, { onDelete: "restrict" }),
		tenantId: integer("tenant_id")
			.notNull()
			.references(() => tenant.id, { onDelete: "restrict" }),
		startDate: date("start_date").notNull(),
		endDate: date("end_date"),
		depositAmount: numeric("deposit_amount", {
			precision: 12,
			scale: 2,
			mode: "number",
		}).notNull(),
		status: leaseStatusEnum("status").default("active").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("lease_unitId_idx").on(table.unitId),
		index("lease_tenantId_idx").on(table.tenantId),
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
		id: serial("id").primaryKey(),
		leaseId: integer("lease_id")
			.notNull()
			.references(() => lease.id, { onDelete: "cascade" }),
		agreedPaymentDay: integer("agreed_payment_day").notNull().default(1),
		rentAmount: numeric("rent_amount", {
			precision: 12,
			scale: 2,
			mode: "number",
		}).notNull(),
		effectiveDate: date("effective_date").notNull(),
		description: text("description"),
		status: leaseRentStatusEnum("status").default("active").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("lease_rent_leaseId_idx").on(table.leaseId),
		index("lease_rent_effectiveDate_idx").on(table.effectiveDate),
	],
);

export const leaseSettlement = pgTable(
	"lease_settlement",
	{
		id: serial("id").primaryKey(),
		leaseId: integer("lease_id")
			.notNull()
			.references(() => lease.id, { onDelete: "cascade" }),
		createdBy: text("created_by")
			.notNull()
			.references(() => user.id, { onDelete: "restrict" }),
		terminationDate: date("termination_date").notNull(),
		depositAtTermination: numeric("deposit_at_termination", {
			precision: 12,
			scale: 2,
			mode: "number",
		}).notNull(),
		totalDeductions: numeric("total_deductions", {
			precision: 12,
			scale: 2,
			mode: "number",
		}).notNull(),
		refundAmount: numeric("refund_amount", {
			precision: 12,
			scale: 2,
			mode: "number",
		}).notNull(),
		outstandingAmount: numeric("outstanding_amount", {
			precision: 12,
			scale: 2,
			mode: "number",
		})
			.notNull()
			.default(0),
		notes: text("notes"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		uniqueIndex("lease_settlement_lease_unique_idx").on(table.leaseId),
		index("lease_settlement_termination_date_idx").on(table.terminationDate),
	],
);

export const leaseSettlementExpense = pgTable(
	"lease_settlement_expense",
	{
		id: serial("id").primaryKey(),
		settlementId: integer("settlement_id")
			.notNull()
			.references(() => leaseSettlement.id, { onDelete: "cascade" }),
		label: text("label").notNull(),
		category: leaseSettlementExpenseCategoryEnum(
			"lease_settlement_expense_category",
		).notNull(),
		amount: numeric("amount", {
			precision: 12,
			scale: 2,
			mode: "number",
		}).notNull(),
		notes: text("notes"),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("lease_settlement_expense_settlement_id_idx").on(table.settlementId),
	],
);

// lease schema

export const selectLeaseSchema = createSelectSchema(lease);
export type LeaseType = z.infer<typeof selectLeaseSchema>;

export const insertLeaseSchema = createInsertSchema(lease);
export type InsertLeaseType = z.infer<typeof insertLeaseSchema>;

export const updateLeaseSchema = createUpdateSchema(lease);
export type UpdateLeaseType = z.infer<typeof updateLeaseSchema>;

// lease rent schemas

export const selectLeaseRentSchema = createSelectSchema(leaseRent);
export type LeaseRentType = z.infer<typeof selectLeaseRentSchema>;

export const insertLeaseRentSchema = createInsertSchema(leaseRent);
export type InsertLeaseRentType = z.infer<typeof insertLeaseRentSchema>;

export const updateLeaseRentSchema = createUpdateSchema(leaseRent);
export type UpdateLeaseRentType = z.infer<typeof updateLeaseRentSchema>;

// lease settlement schemas
export const selectLeaseSettlementSchema = createSelectSchema(leaseSettlement);
export type LeaseSettlementType = z.infer<typeof selectLeaseSettlementSchema>;

export const insertLeaseSettlementSchema = createInsertSchema(leaseSettlement);
export type InsertLeaseSettlementType = z.infer<
	typeof insertLeaseSettlementSchema
>;

export const updateLeaseSettlementSchema = createUpdateSchema(leaseSettlement);
export type UpdateLeaseSettlementType = z.infer<
	typeof updateLeaseSettlementSchema
>;

export const selectLeaseSettlementExpenseSchema = createSelectSchema(
	leaseSettlementExpense,
);
export type LeaseSettlementExpenseType = z.infer<
	typeof selectLeaseSettlementExpenseSchema
>;

export const insertLeaseSettlementExpenseSchema = createInsertSchema(
	leaseSettlementExpense,
);
export type InsertLeaseSettlementExpenseType = z.infer<
	typeof insertLeaseSettlementExpenseSchema
>;

export const updateLeaseSettlementExpenseSchema = createUpdateSchema(
	leaseSettlementExpense,
);
export type UpdateLeaseSettlementExpenseType = z.infer<
	typeof updateLeaseSettlementExpenseSchema
>;

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
	settlement: one(leaseSettlement, {
		fields: [lease.id],
		references: [leaseSettlement.leaseId],
	}),
}));

export const leaseRentRelations = relations(leaseRent, ({ one }) => ({
	lease: one(lease, {
		fields: [leaseRent.leaseId],
		references: [lease.id],
	}),
}));

export const leaseSettlementRelations = relations(
	leaseSettlement,
	({ one, many }) => ({
		lease: one(lease, {
			fields: [leaseSettlement.leaseId],
			references: [lease.id],
		}),
		createdByUser: one(user, {
			fields: [leaseSettlement.createdBy],
			references: [user.id],
		}),
		expenses: many(leaseSettlementExpense),
	}),
);

export const leaseSettlementExpenseRelations = relations(
	leaseSettlementExpense,
	({ one }) => ({
		settlement: one(leaseSettlement, {
			fields: [leaseSettlementExpense.settlementId],
			references: [leaseSettlement.id],
		}),
	}),
);

import { leaseDocument } from "./document";
import { payment } from "./payment";
