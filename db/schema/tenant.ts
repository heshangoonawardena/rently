import { relations } from "drizzle-orm";
import {
	pgTable,
	text,
	timestamp,
	index,
	serial,
	integer,
} from "drizzle-orm/pg-core";
import { organization, user } from "./auth";

export const tenant = pgTable(
	"tenant",
	{
		id: serial("id").primaryKey(),
		organizationId: text("organization_id")
			.notNull()
			.references(() => organization.id, { onDelete: "cascade" }),
		// Nullable — tenant may never sign up for a login account.
		// Set null on user deletion to preserve tenant history.
		userId: text("user_id").references(() => user.id, {
			onDelete: "set null",
		}),
		firstName: text("first_name").notNull(),
		lastName: text("last_name"),
		nickname: text("nickname").unique(),
		address: text("address"),
		nic: text("nic").notNull().unique(),
		phoneNumber: text("phone_number").notNull().unique(),
		occupation: text("occupation"),
		status: tenantStatusEnum("status").default("pending").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("tenant_orgId_idx").on(table.organizationId),
		index("tenant_userId_idx").on(table.userId),
		index("tenant_nic_idx").on(table.nic),
	],
);

export const tenantOccupant = pgTable(
	"tenant_occupant",
	{
		id: serial("id").primaryKey(),
		tenantId: integer("tenant_id")
			.notNull()
			.references(() => tenant.id, { onDelete: "cascade" }),
		firstName: text("first_name").notNull(),
		lastName: text("last_name"),
		nic: text("nic"),
		relationship: text("relationship").notNull(),
		phone: text("phone"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [index("tenant_occupant_tenantId_idx").on(table.tenantId)],
);

// tenant schema
export const selectTenantSchema = createSelectSchema(tenant);
export type Tenant = z.infer<typeof selectTenantSchema>;

export const insertTenantSchema = createInsertSchema(tenant);
export type InsertTenant = z.infer<typeof insertTenantSchema>;

export const updateTenantSchema = createUpdateSchema(tenant);
export type UpdateTenant = z.infer<typeof updateTenantSchema>;

// tenant occupant schema
export const selectTenantOccupantSchema = createSelectSchema(tenantOccupant);
export type TenantOccupant = z.infer<typeof selectTenantOccupantSchema>;

export const insertTenantOccupantSchema = createInsertSchema(tenantOccupant);
export type InsertTenantOccupant = z.infer<typeof insertTenantOccupantSchema>;

export const updateTenantOccupantSchema = createUpdateSchema(tenantOccupant);
export type UpdateTenantOccupant = z.infer<typeof updateTenantOccupantSchema>;

// ============================================================
// RELATIONS
// ============================================================

export const tenantRelations = relations(tenant, ({ one, many }) => ({
	organization: one(organization, {
		fields: [tenant.organizationId],
		references: [organization.id],
	}),
	user: one(user, {
		fields: [tenant.userId],
		references: [user.id],
	}),
	leases: many(lease),
	occupants: many(tenantOccupant),
	documents: many(tenantDocument),
}));

export const tenantOccupantRelations = relations(
	tenantOccupant,
	({ one, many }) => ({
		tenant: one(tenant, {
			fields: [tenantOccupant.tenantId],
			references: [tenant.id],
		}),
		documents: many(tenantDocument),
	}),
);

import { lease } from "./lease";
import { tenantDocument } from "./document";
import {
	createInsertSchema,
	createSelectSchema,
	createUpdateSchema,
} from "drizzle-zod";
import z from "zod";
import { tenantStatusEnum } from "./enums";
