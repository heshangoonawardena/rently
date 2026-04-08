import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, index, serial, integer } from "drizzle-orm/pg-core";
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
		fullName: text("full_name").notNull(),
		nickname: text("nickname"),
		address: text("address"),
		nic: text("nic").notNull().unique(),
		phoneNumber: text("phone_number").notNull().unique(),
		occupation: text("occupation"),
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
		fullName: text("full_name").notNull(),
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
