import { relations } from "drizzle-orm";
import {
	date,
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
import { documentStatusEnum } from "./enums";
import { lease } from "./lease";
import { tenant, tenantOccupant } from "./tenant";
import { unit } from "./unit";

// Property-level documents: tax receipts, council permits, property photos.
// expiryDate drives renewal reminders for time-limited documents.

export const unitDocument = pgTable(
	"unit_document",
	{
		id: serial("id").primaryKey(),
		unitId: integer("unit_id")
			.notNull()
			.references(() => unit.id, { onDelete: "cascade" }),
		documentType: text("document_type").notNull(),
		label: text("label").notNull(),
		description: text("description"),
		storageKey: text("storage_key").notNull(),
		documentDate: date("document_date"),
		expiryDate: date("expiry_date"),
		status: documentStatusEnum("status").default("active").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
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
		id: serial("id").primaryKey(),
		tenantId: integer("tenant_id")
			.notNull()
			.references(() => tenant.id, { onDelete: "cascade" }),
		tenantOccupantId: integer("tenant_occupant_id").references(
			() => tenantOccupant.id,
			{ onDelete: "set null" },
		),
		documentType: text("document_type").notNull(),
		label: text("label").notNull(),
		description: text("description"),
		storageKey: text("storage_key").notNull(),
		status: documentStatusEnum("status").default("active").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
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
		id: serial("id").primaryKey(),
		leaseId: integer("lease_id")
			.notNull()
			.references(() => lease.id, { onDelete: "cascade" }),
		documentType: text("document_type").notNull(),
		label: text("label").notNull(),
		description: text("description"),
		storageKey: text("storage_key").notNull(),
		documentDate: date("document_date"),
		status: documentStatusEnum("status").default("active").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [index("lease_document_leaseId_idx").on(table.leaseId)],
);

// unit document schemas
export const selectUnitDocumentSchema = createSelectSchema(unitDocument);
export type UnitDocumentType = z.infer<typeof selectUnitDocumentSchema>;

export const insertUnitDocumentSchema = createInsertSchema(unitDocument);
export type InsertUnitDocumentType = z.infer<typeof insertUnitDocumentSchema>;

export const updateUnitDocumentSchema = createUpdateSchema(unitDocument);
export type UpdateUnitDocumentType = z.infer<typeof updateUnitDocumentSchema>;

// tenant document schemas
export const selectTenantDocumentSchema = createSelectSchema(tenantDocument);
export type TenantDocumentType = z.infer<typeof selectTenantDocumentSchema>;

export const insertTenantDocumentSchema = createInsertSchema(tenantDocument);
export type InsertTenantDocumentType = z.infer<
	typeof insertTenantDocumentSchema
>;

export const updateTenantDocumentSchema = createUpdateSchema(tenantDocument);
export type UpdateTenantDocumentType = z.infer<
	typeof updateTenantDocumentSchema
>;

// lease document schemas
export const selectLeaseDocumentSchema = createSelectSchema(leaseDocument);
export type LeaseDocumentType = z.infer<typeof selectLeaseDocumentSchema>;

export const insertLeaseDocumentSchema = createInsertSchema(leaseDocument);
export type InsertLeaseDocumentType = z.infer<typeof insertLeaseDocumentSchema>;

export const updateLeaseDocumentSchema = createUpdateSchema(leaseDocument);
export type UpdateLeaseDocumentType = z.infer<typeof updateLeaseDocumentSchema>;

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
