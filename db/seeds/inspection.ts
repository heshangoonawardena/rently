import { DB } from "@/db/db";
import { inspection } from "@/db/schema/inspection";

export const inspections = async (db: DB) => {
	const [userData, unitData] = await Promise.all([
		db.query.user.findMany(),
		db.query.unit.findMany(),
	]);

	await db.insert(inspection).values([
		{
			unitId: unitData[0].id,
			userId: userData[1].id,
			title: "Move-in Inspection",
			scheduledDate: "2024-01-01",
			completedDate: "2024-01-01",
			status: "completed",
		},
		{
			unitId: unitData[1].id,
			userId: userData[2].id,
			title: "Move-out Inspection",
			scheduledDate: "2024-01-01",
			status: "scheduled",
		},
	]);

	console.log("Inspections seeded successfully");
};
