import type { DB } from "@/db/db";
import { inspection } from "@/db/schema/inspection";

export const inspections = async (db: DB) => {
	const [userData, unitData] = await Promise.all([
		db.query.user.findMany(),
		db.query.unit.findMany(),
	]);

	await db.insert(inspection).values([
		{
			unitId: unitData[0].id,
			userId: userData[2].id,
			title: "Move-out Inspection",
			scheduledDate: "2026-07-10",
			description: "Walls need repainting and repair for pet damage",
			status: "completed",
		},
		{
			unitId: unitData[1].id,
			userId: userData[2].id,
			title: "Initial inspection after a month",
			scheduledDate: "2025-05-15",
			description: "Maintaining the house well",
			status: "completed",
		},
		{
			unitId: unitData[1].id,
			userId: userData[2].id,
			title: "Annual inspection",
			scheduledDate: "2026-06-25",
			description: "House is being maintained well, garden is well maintained",
			status: "completed",
		},
		{
			unitId: unitData[1].id,
			userId: userData[0].id,
			title: "Casual inspection",
			scheduledDate: "2026-06-25",
			description: "Check the walls",
			status: "cancelled",
		},
		{
			unitId: unitData[2].id,
			userId: userData[0].id,
			title: "casual inspection",
			scheduledDate: "2026-08-20",
			description: "Check the walls",
			status: "scheduled",
		},
		{
			unitId: unitData[3].id,
			userId: userData[0].id,
			title: "annual inspection",
			scheduledDate: "2026-09-30",
			status: "scheduled",
		},
		{
			unitId: unitData[1].id,
			userId: userData[0].id,
			title: "annual inspection",
			scheduledDate: "2026-09-30",
			status: "scheduled",
		},
	]);

	console.log("Inspections seeded successfully");
};
