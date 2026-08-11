import { format } from "date-fns";
import type { DB } from "@/db/db";
import { utility, utilityBill } from "@/db/schema/utility";

export const utilities = async (db: DB) => {
	const unitData = await db.query.unit.findMany();

	const utilityData = await db
		.insert(utility)
		.values([
			{
				unitId: unitData[0].id,
				utilityType: "electricity",
				holderName: "B K J R V R W Goonawardena",
				accountNumber: "2790590710",
				address: "85/C Carmel Mawatha, Palliyawatta Wattala",
			},
			{
				unitId: unitData[0].id,
				utilityType: "water",
				holderName: "B K J R V R W Goonawardena",
				accountNumber: "67129380",
				address: "85/C Carmel Mawatha, Palliyawatta Wattala",
			},
			{
				unitId: unitData[0].id,
				utilityType: "tax",
				holderName: "B K J R V R W Goonawardena",
				accountNumber: "82647103",
				address: "85/A Carmel Mawatha, Palliyawatta Wattala",
			},
			{
				unitId: unitData[1].id,
				utilityType: "water",
				holderName: "B K J R V R W Goonawardena",
				accountNumber: "10/28/654/725/12",
				address: "85/A Carmel Mawatha, Palliyawatta Wattala",
			},
			{
				unitId: unitData[1].id,
				utilityType: "electricity",
				holderName: "B K J R V R W Goonawardena",
				accountNumber: "2790742812",
				address: "85/B Carmel Mawatha, Palliyawatta Wattala",
			},

			{
				unitId: unitData[2].id,
				utilityType: "electricity",
				holderName: "B K J R V R W Goonawardena",
				accountNumber: "2790546118",
				address: "94/3 Carmel Mawatha, Palliyawatta Wattala",
			},
			{
				unitId: unitData[2].id,
				utilityType: "water",
				holderName: "B K J R V R W Goonawardena",
				accountNumber: "10/28/513/173/14",
				address: "94/3 Carmel Mawatha, Palliyawatta Wattala",
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
	]);

	console.log("Utilities seeded successfully");
};
