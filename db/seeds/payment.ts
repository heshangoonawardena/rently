import { DB } from "@/db/db";
import { payment, paymentReceipt } from "@/db/schema/payment";

export const payments = async (db: DB) => {
	const leaseData = await db.query.lease.findMany();

	await db.insert(payment).values([
		{
			leaseId: leaseData[0].id,
			paymentType: "deposit",
			paymentMethod: "bank_transfer",
			paymentDate: new Date().toISOString().split("T")[0],
			paymentAmount: "1000",
			balanceAfter: "0",
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		{
			leaseId: leaseData[1].id,
			paymentType: "deposit",
			paymentMethod: "online",
			paymentDate: new Date().toISOString().split("T")[0],
			paymentAmount: "2000",
			balanceAfter: "0",
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		{
			leaseId: leaseData[1].id,
			paymentType: "rent",
			paymentMethod: "cash",
			paymentDate: new Date().toISOString().split("T")[0],
			paymentAmount: "1000",
			balanceAfter: "500",
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		{
			leaseId: leaseData[1].id,
			paymentType: "arrear",
			paymentMethod: "cash",
			paymentDate: new Date().toISOString().split("T")[0],
			paymentAmount: "500",
			balanceAfter: "0",
			createdAt: new Date(),
			updatedAt: new Date(),
		},
	]);

	const paymentData = await db.query.payment.findMany();

	await db.insert(paymentReceipt).values([
		{
			paymentId: paymentData[0].id,
			receiptNumber: "RCPT-001",
			issuedDate: new Date().toISOString().split("T")[0],
			amountPaid: "1000",
			balanceAfter: "0",
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		{
			paymentId: paymentData[1].id,
			receiptNumber: "RCPT-002",
			issuedDate: new Date().toISOString().split("T")[0],
			amountPaid: "2000",
			balanceAfter: "0",
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		{
			paymentId: paymentData[2].id,
			receiptNumber: "RCPT-003",
			issuedDate: new Date().toISOString().split("T")[0],
			amountPaid: "1000",
			balanceAfter: "500",
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		{
			paymentId: paymentData[3].id,
			receiptNumber: "RCPT-004",
			issuedDate: new Date().toISOString().split("T")[0],
			amountPaid: "500",
			balanceAfter: "0",
			createdAt: new Date(),
			updatedAt: new Date(),
		},
	]);

	console.log("Payments seeded successfully");
};
