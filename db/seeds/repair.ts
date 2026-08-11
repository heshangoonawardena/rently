import type { DB } from "@/db/db";
import { repairRequest, repairUpdate } from "@/db/schema/repair";

export const repairs = async (db: DB) => {
	const [userData, unitData] = await Promise.all([
		db.query.user.findMany(),
		db.query.unit.findMany(),
	]);

	const repairRequestData = await db
		.insert(repairRequest)
		.values([
			{
				unitId: unitData[0].id,
				userId: userData[1].id,
				repairType: "plumbing",
				title: "Water comming from tap is slow",
				description: "Tank is not being filled up since yesterday",
				priority: "high",
				status: "resolved",
			},
			{
				unitId: unitData[1].id,
				userId: userData[2].id,
				repairType: "plumbing",
				title: "Water comming from tank is slow",
				description: "Tank is not being filled up since yesterday",
				priority: "high",
				status: "resolved",
			},
			{
				unitId: unitData[1].id,
				userId: userData[2].id,
				repairType: "plumbing",
				title: "Window glass is broken",
				description: "Front window glass broken",
				priority: "low",
				status: "resolved",
			},
			{
				unitId: unitData[0].id,
				userId: userData[1].id,
				repairType: "plumbing",
				title: "No water since this morning",
				description: "no water",
				priority: "urgent",
				status: "cancelled",
			},
		])
		.returning();

	await db.insert(repairUpdate).values([
		{
			repairRequestId: repairRequestData[0].id,
			userId: userData[2].id,
			description: "Needs to climb up and check the tank",
			oldStatus: "open",
			newStatus: "in_progress",
		},
		{
			repairRequestId: repairRequestData[0].id,
			userId: userData[2].id,
			description: "Ball Valve needs replacement",
			oldStatus: "in_progress",
			newStatus: "in_progress",
		},
		{
			repairRequestId: repairRequestData[0].id,
			userId: userData[2].id,
			description: "Ball Valve replaced",
			oldStatus: "in_progress",
			newStatus: "resolved",
		},
		{
			repairRequestId: repairRequestData[1].id,
			userId: userData[0].id,
			description: "Measured the glass size ordered it",
			oldStatus: "open",
			newStatus: "in_progress",
		},
		{
			repairRequestId: repairRequestData[1].id,
			userId: userData[0].id,
			description: "Glass replaced",
			oldStatus: "in_progress",
			newStatus: "resolved",
		},
		{
			repairRequestId: repairRequestData[2].id,
			userId: userData[0].id,
			description: "Glass replaced",
			oldStatus: "in_progress",
			newStatus: "resolved",
		},
		{
			repairRequestId: repairRequestData[3].id,
			userId: userData[0].id,
			description: "Water cut in the area",
			oldStatus: "open",
			newStatus: "cancelled",
		},
	]);

	console.log("Repairs seeded successfully");
};
