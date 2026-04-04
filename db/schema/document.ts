import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, date, index } from "drizzle-orm/pg-core";
import { unit } from "./unit";
import { tenant, tenantOccupant } from "./tenant";
import { lease } from "./lease";
import { documentStatusEnum } from "./enums";

// Property-level documents: tax receipts, council permits, property photos.
// expiryDate drives renewal reminders for time-limited documents.

export const unitDocument = pgTable(
	"unit_document",
	{
		id: text("id").primaryKey(),
		unitId: text("unit_id")
			.notNull()
			.references(() => unit.id, { onDelete: "cascade" }),
		documentType: text("document_type").notNull(),
		label: text("label").notNull(),
		description: text("description"),
		storageKey: text("storage_key").notNull(),
		documentDate: date("document_date"),
		expiryDate: date("expiry_date"),
		status: documentStatusEnum("status").default("active").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [index("unit_document_unitId_idx").on(table.unitId)],
);

// Tenant and occupant identity documents: NIC, passport, etc.
// tenantOccupantId is nullable — null means the document belongs
// to the tenant themselves, not an occupant.

export const tenantDocument = pgTable(
	"tenant_document",
	{
		id: text("id").primaryKey(),
		tenantId: text("tenant_id")
			.notNull()
			.references(() => tenant.id, { onDelete: "cascade" }),
		tenantOccupantId: text("tenant_occupant_id").references(
			() => tenantOccupant.id,
			{ onDelete: "set null" },
		),
		documentType: text("document_type").notNull(),
		label: text("label").notNull(),
		description: text("description"),
		storageKey: text("storage_key").notNull(),
		status: documentStatusEnum("status").default("active").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("tenant_document_tenantId_idx").on(table.tenantId),
		index("tenant_document_occupantId_idx").on(table.tenantOccupantId),
	],
);

// Lease-scoped documents: signed agreements, addendums.

export const leaseDocument = pgTable(
	"lease_document",
	{
		id: text("id").primaryKey(),
		leaseId: text("lease_id")
			.notNull()
			.references(() => lease.id, { onDelete: "cascade" }),
		documentType: text("document_type").notNull(),
		label: text("label").notNull(),
		description: text("description"),
		storageKey: text("storage_key").notNull(),
		documentDate: date("document_date"),
		status: documentStatusEnum("status").default("active").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [index("lease_document_leaseId_idx").on(table.leaseId)],
);

// ============================================================
// RELATIONS
// ============================================================

export const unitDocumentRelations = relations(unitDocument, ({ one }) => ({
	unit: one(unit, {
		fields: [unitDocument.unitId],
		references: [unit.id],
	}),
}));

export const tenantDocumentRelations = relations(tenantDocument, ({ one }) => ({
	tenant: one(tenant, {
		fields: [tenantDocument.tenantId],
		references: [tenant.id],
	}),
	occupant: one(tenantOccupant, {
		fields: [tenantDocument.tenantOccupantId],
		references: [tenantOccupant.id],
	}),
}));

export const leaseDocumentRelations = relations(leaseDocument, ({ one }) => ({
	lease: one(lease, {
		fields: [leaseDocument.leaseId],
		references: [lease.id],
	}),
}));
