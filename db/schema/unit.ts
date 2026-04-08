import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, index, serial } from "drizzle-orm/pg-core";
import { organization } from "./auth";
import { unitTypeEnum, unitStatusEnum, utilityBillingModeEnum } from "./enums";

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
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [index("unit_orgId_idx").on(table.organizationId)],
);

// ============================================================
// RELATIONS
// ============================================================

export const unitRelations = relations(unit, ({ one, many }) => ({
	organization: one(organization, {
		fields: [unit.organizationId],
		references: [organization.id],
	}),
	// Back-references declared here to keep unit self-contained.
	// The other side is declared in each domain file.
	leases: many(lease),
	utilities: many(utility),
	repairRequests: many(repairRequest),
	inspections: many(inspection),
	documents: many(unitDocument),
}));

// Lazy imports to avoid circular dependency — these are resolved
// at runtime by Drizzle's relation system, not at module load time.
import { lease } from "./lease";
import { utility } from "./utility";
import { repairRequest } from "./repair";
import { inspection } from "./inspection";
import { unitDocument } from "./document";
