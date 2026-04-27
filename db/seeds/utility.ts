import { DB } from "@/db/db";
import { utility, utilityBill } from "@/db/schema/utility";

export const utilities = async (db: DB) => {
	const unitData = await db.query.unit.findMany();

	const utilityData = await db
		.insert(utility)
		.values([
			{
				unitId: unitData[0].id,
				utilityType: "electricity",
				holderName: "A B Perera",
				accountNumber: "12345",
			},
			{
				unitId: unitData[1].id,
				utilityType: "water",
				holderName: "Y Z Silva",
				accountNumber: "6712",
			},
		])
		.returning();

	await db.insert(utilityBill).values([
		{
			utilityId: utilityData[0].id,
			billAmount: "5000",
			periodStart: new Date().toISOString().split("T")[0],
			periodEnd: new Date().toISOString().split("T")[0],
			status: "issued",
		},
		{
			utilityId: utilityData[1].id,
			billAmount: "2000",
			periodStart: new Date().toISOString().split("T")[0],
			periodEnd: new Date().toISOString().split("T")[0],
			status: "issued",
		},
	]);

	console.log("Utilities seeded successfully");
};
