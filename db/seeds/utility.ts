import { DB } from "@/db/db";
import { utility, utilityBill } from "@/db/schema/utility";
import { format } from "date-fns";

export const utilities = async (db: DB) => {
	const unitData = await db.query.unit.findMany();

	const utilityData = await db
		.insert(utility)
		.values([
			{
				unitId: unitData[0].id,
				utilityType: "electricity",
				holderName: "A B Perera",
				accountNumber: "12345678",
				address: "456 Oak Ave, Springfield, IL 62702",
			},
			{
				unitId: unitData[0].id,
				utilityType: "water",
				holderName: "A B Perera",
				accountNumber: "67129380",
				address: "456 Oak Ave, Springfield, IL 62702",
			},
			{
				unitId: unitData[0].id,
				utilityType: "tax",
				holderName: "A B Perera",
				accountNumber: "82647103",
				address: "456 Oak Ave, Springfield, IL 62702",
			},
			{
				unitId: unitData[1].id,
				utilityType: "water",
				holderName: "Y Z Silva",
				accountNumber: "67129381",
				address: "456 Oak Ave, Springfield, IL 62702",
			},
		])
		.returning();

	await db.insert(utilityBill).values([
		{
			utilityId: utilityData[0].id,
			billAmount: "5000",
			periodStart: format(new Date(), "yyyy-MM-dd"),
			periodEnd: format(new Date(), "yyyy-MM-dd"),
			status: "issued",
		},
		{
			utilityId: utilityData[1].id,
			billAmount: "2000",
			periodStart: format(new Date(), "yyyy-MM-dd"),
			periodEnd: format(new Date(), "yyyy-MM-dd"),
			status: "issued",
		},
	]);

	console.log("Utilities seeded successfully");
};
