import { DB } from "@/db/db";
import { payment, paymentReceipt } from "@/db/schema/payment";
import { getFutureDate, getPastDate } from "@/lib/utils";

export const payments = async (db: DB) => {
	const leaseData = await db.query.lease.findMany();

	const paymentData = await db
		.insert(payment)
		.values([
			{
				leaseId: leaseData[0].id,
				paymentType: "deposit",
				paymentMethod: "bank_transfer",
				paymentDate: getPastDate(60),
				paymentAmount: "1000",
				balanceAfter: "0",
			},
			{
				leaseId: leaseData[1].id,
				paymentType: "deposit",
				paymentMethod: "online",
				paymentDate: getPastDate(60),
				paymentAmount: "4000",
				balanceAfter: "0",
			},
			{
				leaseId: leaseData[1].id,
				paymentType: "partial_rent",
				paymentMethod: "cheque",
				paymentDate: getPastDate(30),
				paymentAmount: "2000",
				balanceAfter: "0",
			},
			{
				leaseId: leaseData[1].id,
				paymentType: "partial_rent",
				paymentMethod: "cheque",
				paymentDate: getFutureDate(0),
				paymentAmount: "1500",
				balanceAfter: "500",
			},
		])
		.returning();

	await db.insert(paymentReceipt).values([
		{
			paymentId: paymentData[0].id,
			receiptNumber: "RCPT-001",
			issuedDate: getPastDate(60),
			amountPaid: "1000",
			balanceAfter: "0",
		},
		{
			paymentId: paymentData[1].id,
			receiptNumber: "RCPT-002",
			issuedDate: getPastDate(60),
			amountPaid: "4000",
			balanceAfter: "0",
		},
		{
			paymentId: paymentData[2].id,
			receiptNumber: "RCPT-003",
			issuedDate: getPastDate(30),
			amountPaid: "2000",
			balanceAfter: "0",
		},
		{
			paymentId: paymentData[3].id,
			receiptNumber: "RCPT-004",
			issuedDate: getPastDate(0),
			amountPaid: "1500",
			balanceAfter: "500",
		},
	]);

	console.log("Payments seeded successfully");
};
