import { DB } from "@/db/db";
import { tenant, tenantOccupant } from "@/db/schema/tenant";

export const tenants = async (db: DB) => {
	const [userData, organizationData] = await Promise.all([
		db.query.user.findMany(),
		db.query.organization.findMany(),
	]);

	await db.insert(tenant).values([
		{
			organizationId: organizationData[0].id,
			userId: userData[0].id,
			fullName: "Alice",
			nic: "200000000000",
			phoneNumber: "+94764468108",
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		{
			organizationId: organizationData[0].id,
			userId: userData[0].id,
			fullName: "Charlie",
			nic: "200000000001",
			phoneNumber: "+94764468109",
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		{
			organizationId: organizationData[0].id,
			userId: userData[0].id,
			fullName: "Diana",
			nic: "200000000002",
			phoneNumber: "+94764468110",
			createdAt: new Date(),
			updatedAt: new Date(),
		},
	]);

	const tenantData = await db.query.tenant.findMany();

	await db.insert(tenantOccupant).values([
		{
			tenantId: tenantData[0].id,
			fullName: "Bob",
			nic: "2000000000012",
			relationship: "Spouse",
			phone: "94764468109",
			createdAt: new Date(),
			updatedAt: new Date(),
		},
	]);

	console.log("Tenants seeded successfully");
};
