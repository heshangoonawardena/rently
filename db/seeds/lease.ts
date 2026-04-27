import { DB } from "@/db/db";
import { lease, leaseRent } from "@/db/schema/lease";

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
				startDate: new Date().toISOString().split("T")[0],
				depositAmount: "1000",
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			{
				tenantId: tenantData[0].id,
				unitId: unitData[1].id,
				startDate: new Date().toISOString().split("T")[0],
				depositAmount: "2000",
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		])
		.returning();

	await db.insert(leaseRent).values([
		{
			leaseId: leaseData[0].id,
			rentAmount: "1500",
			effectiveDate: new Date().toISOString().split("T")[0],
			createdAt: new Date(),
			updatedAt: new Date(),
		},
	]);

	console.log("Leases seeded successfully");
};
