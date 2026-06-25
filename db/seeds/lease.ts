import { DB } from "@/db/db";
import { lease, leaseRent } from "@/db/schema/lease";
import { getFutureDate, getPastDate } from "@/lib/utils";

export const leases = async (db: DB) => {
	const [unitData, tenantData] = await Promise.all([
		db.query.unit.findMany(),
		db.query.tenant.findMany(),
	]);


	const leaseData = await db
		.insert(lease)
		.values([
			{
				tenantId: tenantData[0].id,
				unitId: unitData[0].id,
				startDate: getPastDate(60),
				endDate: getFutureDate(28),
				depositAmount: "1000",
			},
			{
				tenantId: tenantData[0].id,
				unitId: unitData[1].id,
				startDate: getPastDate(60),
				endDate: getFutureDate(43),
				depositAmount: "4000",
			},
		])
		.returning();

	await db.insert(leaseRent).values([
		{
			leaseId: leaseData[0].id,
			rentAmount: "500",
			effectiveDate: getPastDate(60),
		},
		{
			leaseId: leaseData[1].id,
			rentAmount: "2000",
			effectiveDate: getPastDate(60),
		},
	]);

	console.log("Leases seeded successfully");
};
