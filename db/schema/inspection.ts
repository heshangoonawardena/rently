import { relations } from "drizzle-orm";
import {
	pgTable,
	text,
	timestamp,
	date,
	index,
	serial,
	integer,
} from "drizzle-orm/pg-core";
import { unit } from "./unit";
import { user } from "./auth";
import { inspectionStatusEnum } from "./enums";
import {
	createInsertSchema,
	createSelectSchema,
	createUpdateSchema,
} from "drizzle-zod";
import z from "zod";

export const inspection = pgTable(
	"inspection",
	{
		id: serial("id").primaryKey(),
		unitId: integer("unit_id")
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
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true })
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

export const selectInspectionSchema = createSelectSchema(inspection);
export type Inspection = z.infer<typeof selectInspectionSchema>;

export const insertInspectionSchema = createInsertSchema(inspection);
export type InsertInspection = z.infer<typeof insertInspectionSchema>;

export const updateInspectionSchema = createUpdateSchema(inspection);
export type UpdateInspection = z.infer<typeof updateInspectionSchema>;

// ============================================================
// RELATIONS
// ============================================================

export const inspectionRelations = relations(inspection, ({ one }) => ({
	unit: one(unit, { fields: [inspection.unitId], references: [unit.id] }),
	user: one(user, { fields: [inspection.userId], references: [user.id] }),
}));
