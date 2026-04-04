import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, date, index } from "drizzle-orm/pg-core";
import { unit } from "./unit";
import { user } from "./auth";
import { inspectionStatusEnum } from "./enums";

export const inspection = pgTable(
	"inspection",
	{
		id: text("id").primaryKey(),
		unitId: text("unit_id")
			.notNull()
			.references(() => unit.id, { onDelete: "restrict" }),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "restrict" }),
		title: text("title").notNull(),
		description: text("description"),
		scheduledDate: date("scheduled_date").notNull(),
		completedDate: date("completed_date"),
		status: inspectionStatusEnum("status").default("scheduled").notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at")
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("inspection_unitId_idx").on(table.unitId),
		index("inspection_scheduledDate_idx").on(table.scheduledDate),
		index("inspection_status_idx").on(table.status),
	],
);

// ============================================================
// RELATIONS
// ============================================================

export const inspectionRelations = relations(inspection, ({ one }) => ({
	unit: one(unit, { fields: [inspection.unitId], references: [unit.id] }),
	user: one(user, { fields: [inspection.userId], references: [user.id] }),
}));
