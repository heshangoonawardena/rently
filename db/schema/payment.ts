import { relations } from "drizzle-orm";
import {
	date,
	index,
	integer,
	numeric,
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
import { paymentMethodEnum, paymentTypeEnum } from "./enums";
import { lease } from "./lease";

export const payment = pgTable(
	"payment",
	{
		id: serial("id").primaryKey(),
		leaseId: integer("lease_id")
			.notNull()
			.references(() => lease.id, { onDelete: "restrict" }),
		paymentType: paymentTypeEnum("payment_type").notNull(),
		paymentMethod: paymentMethodEnum("payment_method").notNull(),
		paymentDate: date("payment_date").notNull(),
		paymentAmount: numeric("payment_amount", {
			precision: 12,
			scale: 2,
			mode: "number",
		}).notNull(),
		// Applicable rent period. Optional for non-rent payment types (e.g. deposit).
		periodStart: date("period_start"),
		periodEnd: date("period_end"),
		receiptNumber: text("receipt_number"),
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
		index("payment_leaseId_idx").on(table.leaseId),
		index("paymentDate_idx").on(table.paymentDate),
		index("paymentType_idx").on(table.paymentType),
		index("paymentReceiptNumber_idx").on(table.receiptNumber),
	],
);

// payment schema
export const selectPaymentSchema = createSelectSchema(payment);
export type PaymentType = z.infer<typeof selectPaymentSchema>;

export const insertPaymentSchema = createInsertSchema(payment);
export type InsertPaymentType = z.infer<typeof insertPaymentSchema>;

export const updatePaymentSchema = createUpdateSchema(payment);
export type UpdatePaymentType = z.infer<typeof updatePaymentSchema>;

// ============================================================
// RELATIONS
// ============================================================

export const paymentRelations = relations(payment, ({ one }) => ({
	lease: one(lease, {
		fields: [payment.leaseId],
		references: [lease.id],
	}),
}));
