import { DB } from "@/db/db";
import { payment, paymentReceipt } from "@/db/schema/payment";
import { getPastDate } from "@/lib/utils";

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
				periodStart: getPastDate(60),
				periodEnd: getPastDate(30),
				paymentAmount: 1000,
			},
			{
				leaseId: leaseData[0].id,
				paymentType: "rent",
				paymentMethod: "cash",
				paymentDate: getPastDate(60),
				periodStart: getPastDate(60),
				periodEnd: getPastDate(30),
				paymentAmount: 500,
			},
			// {
			// 	leaseId: leaseData[1].id,
			// 	paymentType: "deposit",
			// 	paymentMethod: "online",
			// 	paymentDate: getPastDate(50),
			// 	paymentAmount: 4000,
			// },
			// {
			// 	leaseId: leaseData[1].id,
			// 	paymentType: "rent",
			// 	paymentMethod: "cheque",
			// 	paymentDate: getPastDate(50),
			// 	paymentAmount: 2000,
			// },
			// {
			// 	leaseId: leaseData[2].id,
			// 	paymentType: "deposit",
			// 	paymentMethod: "cash",
			// 	paymentDate: getPastDate(45),
			// 	paymentAmount: 10000,
			// },
			// {
			// 	leaseId: leaseData[2].id,
			// 	paymentType: "rent",
			// 	paymentMethod: "bank_transfer",
			// 	paymentDate: getPastDate(45),
			// 	paymentAmount: 5000,
			// },
		])
		.returning();

	await db.insert(paymentReceipt).values([
		{
			paymentId: paymentData[0].id,
			receiptNumber: "RCPT-001",
			issuedDate: getPastDate(60),
			amountPaid: 1000,
		},
		{
			paymentId: paymentData[1].id,
			receiptNumber: "RCPT-002",
			issuedDate: getPastDate(30),
			amountPaid: 500,
		},
		// {
		// 	paymentId: paymentData[2].id,
		// 	receiptNumber: "RCPT-003",
		// 	issuedDate: getPastDate(50),
		// 	amountPaid: 4000,
		// },
		// {
		// 	paymentId: paymentData[3].id,
		// 	receiptNumber: "RCPT-004",
		// 	issuedDate: getPastDate(20),
		// 	amountPaid: 2000,
		// },
		// {
		// 	paymentId: paymentData[4].id,
		// 	receiptNumber: "RCPT-005",
		// 	issuedDate: getPastDate(40),
		// 	amountPaid: 10000,
		// },
		// {
		// 	paymentId: paymentData[5].id,
		// 	receiptNumber: "RCPT-006",
		// 	issuedDate: getPastDate(10),
		// 	amountPaid: 5000,
		// },
	]);

	console.log("Payments seeded successfully");
};
