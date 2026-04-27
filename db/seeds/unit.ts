import { DB } from "@/db/db";
import { unit } from "@/db/schema/unit";

export const units = async (db: DB) => {
	const organizationData = await db.query.organization.findMany();

	await db.insert(unit).values([
		{
			organizationId: organizationData[0].id,
			name: "House A",
			type: "house",
			address: "456 Oak Ave, Springfield, IL 62702",
			utilityBillingMode: "fixed_charge",
			status: "occupied",
		},
		{
			organizationId: organizationData[0].id,
			name: "Warehouse Unit 1",
			type: "warehouse",
			address: "789 Industrial Blvd, Springfield, IL 62703",
			utilityBillingMode: "metered",
			status: "available",
		},
		{
			organizationId: organizationData[0].id,
			name: "Land Plot 5",
			type: "land",
			address: "321 Green Valley Rd, Springfield, IL 62704",
			utilityBillingMode: "tenant_managed",
			status: "available",
		},
	]);

	console.log("Units seeded successfully");
};
