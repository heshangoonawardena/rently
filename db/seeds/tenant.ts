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
			userId: userData[1].id,
			firstName: "Alice",
			lastName: "Lopez",
			nickname: "Alice the greatest",
			occupation: "teacher",
			nic: "200000000000",
			phoneNumber: "0764468108",
			status: "active",
			address: "456 Oak Ave, Springfield, IL 62702",
		},
		{
			organizationId: organizationData[0].id,
			firstName: "Perera",
			nickname: "Mr Perera",
			nic: "200000000001",
			phoneNumber: "0764468107",
			status: "pending",
			address: "456 Oak Ave, Springfield, IL 62702",
		},
	]);

	const tenantData = await db.query.tenant.findMany();

	await db.insert(tenantOccupant).values([
		{
			tenantId: tenantData[0].id,
			firstName: "Bob",
			nic: "2000000000012",
			relationship: "Spouse",
			phone: "0764468109",
		},
		{
			tenantId: tenantData[0].id,
			firstName: "Carol",
			nic: "2000000000013",
			relationship: "Father",
			phone: "0764468108",
		},
		{
			tenantId: tenantData[0].id,
			firstName: "Denis",
			nic: "2000000000014",
			relationship: "Mother",
			phone: "0764468111",
		},
		{
			tenantId: tenantData[0].id,
			firstName: "Eve",
			nic: "2000000010014",
			relationship: "Daughter",
			phone: "0764168111",
		},
	]);

	console.log("Tenants seeded successfully");
};
