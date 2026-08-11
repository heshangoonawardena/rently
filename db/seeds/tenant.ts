import type { DB } from "@/db/db";
import { tenant, tenantOccupant } from "@/db/schema/tenant";
import { getPastDateTime } from "@/lib/utils";

export const tenants = async (db: DB) => {
	const [userData, organizationData] = await Promise.all([
		db.query.user.findMany(),
		db.query.organization.findMany(),
	]);

	await db.insert(tenant).values([
		// {
		// 	organizationId: organizationData[0].id,
		// 	firstName: "Alice",
		// 	lastName: "Lopez",
		// 	nickname: "Alice the greatest",
		// 	occupation: "teacher",
		// 	nic: "200000000000",
		// 	phoneNumber: "0764468108",
		// 	status: "active",
		// 	address: "456 Oak Ave, Springfield, IL 62702",
		// },
		{
			organizationId: organizationData[0].id,
			firstName: "Thyagaraja",
			lastName: "Koneshwaran",
			nickname: "Konesh",
			nic: "600302221V",
			phoneNumber: "0741157670", // phone number
			status: "inactive",
			address: "36/3/2 Galpotta road, Kotahena, Colombo 13",
			createdAt: getPastDateTime(1640),
		},
		{
			organizationId: organizationData[0].id,
			userId: userData[1].id,
			firstName: "Milan",
			lastName: "Mathes Arachchige Chathuranga",
			nickname: "Milan",
			occupation: "Basketball Trainee",
			nic: "940741394V",
			phoneNumber: "0755115972",
			status: "active",
			address: "106/4 Thimbirigasyaya, Hendala, Wattala",
		},
		{
			organizationId: organizationData[0].id,
			firstName: "Chamara",
			lastName: "Wickramasinghe Welahettige Rodrigo",
			nickname: "Mr Chamara",
			occupation: "polythene manufacturing ",
			nic: "197777777777",
			phoneNumber: "0722222222", // phone number
			status: "active",
			address: "67/16 Weliamuna road, Hendala, Wattala",
		},
		{
			organizationId: organizationData[0].id,
			firstName: "Kanthi",
			lastName: "Bulathsinhalage Hilda Cooray",
			nickname: "Mr Jayalath",
			nic: "198888888888",
			phoneNumber: "0733333333", // phone number
			status: "active",
			address: "67/16 Weliamuna road, Hendala, Wattala", // nic address
		},
	]);

	const tenantData = await db.query.tenant.findMany();

	await db.insert(tenantOccupant).values([
		{
			tenantId: tenantData[0].id,
			firstName: "Bala",
			nic: "195613590834", // change to real nic
			relationship: "Father",
			phone: "0764468109",
		},
		{
			tenantId: tenantData[1].id,
			firstName: "Kanthi",
			nic: "196049572538", // change to real nic
			relationship: "Mother",
			phone: "0722958109",
		},
		{
			tenantId: tenantData[2].id,
			firstName: "Sarath",
			nic: "197449374958", // change to real nic
			relationship: "Father",
			phone: "0764466109",
		},
		{
			tenantId: tenantData[3].id,
			firstName: "Nimal",
			nic: "198515678912", // change to real nic
			relationship: "Father",
			phone: "0768468109",
		},
	]);

	console.log("Tenants seeded successfully");
};
