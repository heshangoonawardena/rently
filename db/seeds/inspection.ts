import { DB } from "@/db/db";
import { inspection } from "@/db/schema/inspection";
import { getFutureDate, getPastDate } from "@/lib/utils";

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
			scheduledDate: getPastDate(30),
			completedDate: getPastDate(20),
			status: "completed",
		},
		{
			unitId: unitData[1].id,
			userId: userData[2].id,
			title: "Move-out Inspection",
			scheduledDate: getFutureDate(17),
			status: "scheduled",
		},
	]);

	console.log("Inspections seeded successfully");
};
