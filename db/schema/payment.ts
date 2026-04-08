import { relations } from "drizzle-orm";
import {
	pgTable,
	text,
	timestamp,
	numeric,
	date,
	index,
	integer,
	serial,
} from "drizzle-orm/pg-core";
import { lease } from "./lease";
import { paymentTypeEnum, paymentMethodEnum } from "./enums";

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
		}).notNull(),
		// Running balance after this payment. Negative value = tenant in arrears.
		balanceAfter: numeric("balance_after", {
			precision: 12,
			scale: 2,
		}).notNull(),
		// Applicable rent period. Optional for non-rent payment types (e.g. deposit).
		periodStart: date("period_start"),
		periodEnd: date("period_end"),
		description: text("description"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("payment_leaseId_idx").on(table.leaseId),
		index("paymentDate_idx").on(table.paymentDate),
		index("paymentType_idx").on(table.paymentType),
	],
);

// Immutable after creation — never update a receipt row.
// receiptNumber is org-scoped and sequential, generated server-side on insert.
// Recommended format: RCP-{YYYY}-{00001}
export const paymentReceipt = pgTable(
	"payment_receipt",
	{
		id: serial("id").primaryKey(),
		paymentId: integer("payment_id")
			.notNull()
			.unique()
			.references(() => payment.id, { onDelete: "restrict" }),
		receiptNumber: text("receipt_number").notNull(),
		issuedDate: date("issued_date").notNull(),
		amountPaid: numeric("amount_paid", { precision: 12, scale: 2 }).notNull(),
		balanceAfter: numeric("balance_after", {
			precision: 12,
			scale: 2,
		}).notNull(),
		// Human-readable period label e.g. "March 2025" or "15 Jan – 14 Feb 2025"
		period: text("period"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [index("payment_receiptNumber_idx").on(table.receiptNumber)],
);

// ============================================================
// RELATIONS
// ============================================================

export const paymentRelations = relations(payment, ({ one }) => ({
	lease: one(lease, {
		fields: [payment.leaseId],
		references: [lease.id],
	}),
	receipt: one(paymentReceipt, {
		fields: [payment.id],
		references: [paymentReceipt.paymentId],
	}),
}));

export const paymentReceiptRelations = relations(paymentReceipt, ({ one }) => ({
	payment: one(payment, {
		fields: [paymentReceipt.paymentId],
		references: [payment.id],
	}),
}));
