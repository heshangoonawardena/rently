import { DB } from "@/db/db";
import {
	unitDocument,
	tenantDocument,
	leaseDocument,
} from "@/db/schema/document";

export const documents = async (db: DB) => {
	const unitData = await db.query.unit.findMany();

	await db.insert(unitDocument).values([
		{
			unitId: unitData[0].id,
			documentType: "deed",
			label: "Property Deed",
			storageKey: "/documents/deed-house-a.pdf",
			documentDate: "2023-12-01",
			status: "active",
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		{
			unitId: unitData[2].id,
			documentType: "insurance",
			label: "Insurance Certificate",
			storageKey: "/documents/insurance-house-a.pdf",
			documentDate: "2024-01-01",
			status: "superseded",
			createdAt: new Date(),
			updatedAt: new Date(),
		},
	]);

	const [tenantData, tenantOccupantData] = await Promise.all([
		db.query.tenant.findMany(),
		db.query.tenantOccupant.findMany(),
	]);

	await db.insert(tenantDocument).values([
		{
			tenantId: tenantData[0].id,
			documentType: "identification",
			label: "ID Card",
			storageKey: "/documents/id-alice-williams.pdf",
			status: "active",
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		{
			tenantId: tenantData[0].id,
			tenantOccupantId: tenantOccupantData[0].id,
			documentType: "identification",
			label: "Passport",
			storageKey: "/documents/id-alice-williams.pdf",
			status: "expired",
			createdAt: new Date(),
			updatedAt: new Date(),
		},
	]);

	const leaseData = await db.query.lease.findMany();

	await db.insert(leaseDocument).values([
		{
			leaseId: leaseData[0].id,
			documentType: "agreement",
			label: "agreement copy",
			storageKey: "/documents/id-alice-williams.pdf",
			documentDate: "2023-12-01",
			status: "active",
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		{
			leaseId: leaseData[1].id,
			documentType: "agreement",
			label: "agreement copy",
			storageKey: "/documents/id-alice-williams.pdf",
			documentDate: "2023-12-01",
			status: "expired",
			createdAt: new Date(),
			updatedAt: new Date(),
		},
	]);

	console.log("Documents seeded successfully");
};
