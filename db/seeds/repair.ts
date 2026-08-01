import { DB } from "@/db/db";
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
				userId: userData[0].id,
				repairType: "plumbing",
				title: "Leaky Faucet in Kitchen",
				description: "The kitchen faucet has been dripping for the past week",
				priority: "medium",
				status: "resolved",
			},
			{
				unitId: unitData[1].id,
				userId: userData[1].id,
				repairType: "electrical",
				title: "Broken Light Switch",
				description: "Light switch in living room is not working",
				priority: "high",
				status: "in_progress",
			},
			{
				unitId: unitData[1].id,
				userId: userData[1].id,
				repairType: "other",
				title: "No power",
				description: "No power from 9 am today",
				priority: "urgent",
				status: "cancelled",
			},
		])
		.returning();

	// const repairRequestData = await db.query.repairRequest.findMany();

	await db.insert(repairUpdate).values([
		{
			repairRequestId: repairRequestData[0].id,
			userId: userData[1].id,
			oldStatus: "open",
			description: "Faucet needs to be replaced",
			newStatus: "in_progress",
		},
		{
			repairRequestId: repairRequestData[0].id,
			description: "Replaced the faucet and charged the tenant",
			userId: userData[1].id,
			oldStatus: "in_progress",
			newStatus: "resolved",
		},
		{
			repairRequestId: repairRequestData[1].id,
			userId: userData[2].id,
			oldStatus: "open",
			newStatus: "in_progress",
		},
		{
			repairRequestId: repairRequestData[2].id,
			userId: userData[2].id,
			description: "Island-wide power cut",
			oldStatus: "open",
			newStatus: "cancelled",
		},
	]);

	console.log("Repairs seeded successfully");
};
