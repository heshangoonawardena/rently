import type { DB } from "@/db/db";
import { unit } from "@/db/schema/unit";
import { getPastDateTime } from "@/lib/utils";

export const units = async (db: DB) => {
	const organizationData = await db.query.organization.findMany();

	await db.insert(unit).values([
		{
			organizationId: organizationData[0].id,
			name: "House 1",
			type: "house",
			address: "85/C Carmel Lane, Hendala, Wattala",
			utilityBillingMode: "tenant_managed",
			status: "available",
			description: "2 Bedrooms, 1 Bathroom, Tiled floor",
			createdAt: getPastDateTime(1665),
		},
		{
			organizationId: organizationData[0].id,
			name: "House 2",
			type: "house",
			address: "85/B Carmel Lane, Palliyawatta, Hendala, Wattala",
			utilityBillingMode: "tenant_managed",
			status: "occupied",
			description: "2 Bedrooms, 1 Bathroom, Tiled floor",
		},
		{
			organizationId: organizationData[0].id,
			name: "Wearhouse 1",
			type: "warehouse",
			address: "94/3 Carmel Lane, Hendala, Wattala",
			utilityBillingMode: "tenant_managed",
			status: "occupied",
			description: "1 Bathroom, Asbestos roof",
		},
		{
			organizationId: organizationData[0].id,
			name: "House 3",
			type: "house",
			address: "85/C Carmel Lane, Hendala, Wattala",
			utilityBillingMode: "tenant_managed",
			status: "occupied",
			description: "2 Bedrooms, 1 Bathroom, Tiled floor",
		},
	]);

	console.log("Units seeded successfully");
};
