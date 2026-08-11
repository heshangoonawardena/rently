import type { DB } from "@/db/db";
import {
	lease,
	leaseRent,
	leaseSettlement,
	leaseSettlementExpense,
} from "@/db/schema/lease";

export const leases = async (db: DB) => {
	const [unitData, tenantData, userData] = await Promise.all([
		db.query.unit.findMany(),
		db.query.tenant.findMany(),
		db.query.user.findMany(),
	]);

	const leaseData = await db
		.insert(lease)
		.values([
			{
				tenantId: tenantData[0].id,
				unitId: unitData[0].id,
				startDate: "2022-02-10",
				endDate: "2026-07-15",
				depositAmount: 216_000,
				status: "terminated",
				createdAt: new Date("2024-02-10T13:30:00.000Z"),
				updatedAt: new Date("2026-07-15T13:30:00.000Z"),
			},
			{
				tenantId: tenantData[1].id,
				unitId: unitData[1].id,
				startDate: "2025-04-12",
				endDate: "2027-04-11",
				depositAmount: 350_000,
				status: "active",
				createdAt: new Date("2025-04-12T13:30:00.000Z"),
				updatedAt: new Date("2025-04-12T13:30:00.000Z"),
			},
			{
				tenantId: tenantData[2].id,
				unitId: unitData[2].id,
				startDate: "2024-07-01",
				endDate: "2029-06-01",
				depositAmount: 720_000,
				status: "active",
				createdAt: new Date("2024-07-01T13:30:00.000Z"),
				updatedAt: new Date("2024-07-01T13:30:00.000Z"),
			},
			{
				tenantId: tenantData[3].id,
				unitId: unitData[3].id,
				startDate: "2023-09-01",
				endDate: "2027-08-31",
				depositAmount: 420_000,
				status: "extended",
				createdAt: new Date("2023-09-01T13:30:00.000Z"),
				updatedAt: new Date("2025-09-01T13:30:00.000Z"),
			},
		])
		.returning();

	await db.insert(leaseRent).values([
		{
			leaseId: leaseData[0].id,
			agreedPaymentDay: 15,
			rentAmount: 36_000,
			effectiveDate: "2022-02-10",
		},
		{
			leaseId: leaseData[0].id,
			agreedPaymentDay: 15,
			rentAmount: 40_000,
			effectiveDate: "2024-02-10",
		},
		{
			leaseId: leaseData[1].id,
			agreedPaymentDay: 12,
			rentAmount: 50_000,
			effectiveDate: "2025-04-12",
		},
		{
			leaseId: leaseData[2].id,
			agreedPaymentDay: 12,
			rentAmount: 90_000,
			effectiveDate: "2024-07-01",
		},
		{
			leaseId: leaseData[3].id,
			agreedPaymentDay: 5,
			rentAmount: 35_000,
			effectiveDate: "2023-09-01",
		},
		{
			leaseId: leaseData[3].id,
			agreedPaymentDay: 5,
			rentAmount: 45_000,
			effectiveDate: "2025-09-01",
		},
	]);

	const leaseSettlementData = await db
		.insert(leaseSettlement)
		.values([
			{
				leaseId: leaseData[0].id,
				createdBy: userData[0].id,
				terminationDate: "2026-07-15",
				depositAtTermination: 216_000,
				totalDeductions: 42_000,
				refundAmount: 174_000,
			},
		])
		.returning();

	await db.insert(leaseSettlementExpense).values([
		{
			settlementId: leaseSettlementData[0].id,
			label: "Repaint walls",
			category: "damage_charge",
			amount: 30_000,
		},
		{
			settlementId: leaseSettlementData[0].id,
			label: "Repair walls",
			category: "pet_damage",
			amount: 12_000,
		},
	]);

	console.log("Leases seeded successfully");
};
