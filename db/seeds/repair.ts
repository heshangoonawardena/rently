import { DB } from "@/db/db";
import { repairRequest, repairUpdate } from "@/db/schema/repair";

export const repairs = async (db: DB) => {
	const [userData, unitData] = await Promise.all([
		db.query.user.findMany(),
		db.query.unit.findMany(),
	]);

	await db.insert(repairRequest).values([
		{
			unitId: unitData[0].id,
			userId: userData[0].id,
			repairType: "plumbing",
			title: "Leaky Faucet in Kitchen",
			description: "The kitchen faucet has been dripping for the past week",
			priority: "medium",
			status: "resolved",
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		{
			unitId: unitData[1].id,
			userId: userData[1].id,
			repairType: "electrical",
			title: "Broken Light Switch",
			description: "Light switch in living room is not working",
			priority: "high",
			status: "in_progress",
			createdAt: new Date(),
			updatedAt: new Date(),
		},
	]);

	const repairRequestData = await db.query.repairRequest.findMany();

	await db.insert(repairUpdate).values([
		{
			repairRequestId: repairRequestData[0].id,
			userId: userData[1].id,
			oldStatus: "open",
			newStatus: "in_progress",
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		{
			repairRequestId: repairRequestData[1].id,
			userId: userData[2].id,
			oldStatus: "in_progress",
			newStatus: "resolved",
			createdAt: new Date(),
			updatedAt: new Date(),
		},
	]);

	console.log("Repairs seeded successfully");
};
