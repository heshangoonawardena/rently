import { oc } from "@orpc/contract";
import z from "zod";
import {
	listPaymentReceiptInput,
	listPaymentReceiptOutput,
	paymentReceiptOutput,
	receiptInput,
} from "../schemas/payment.receipt.schema";
import {
	createPayment,
	listPaymentInput,
	listPaymentOutput,
	nextRentMonthInput,
	nextRentMonthOutput,
	paymentInput,
	paymentOutput,
	updatePayment,
} from "../schemas/payment.schema";

export const base = oc.errors({
	UNAUTHORIZED: {
		status: 401,
		message: "Authentication required",
	},
	FORBIDDEN: {
		status: 403,
		message: "You do not have permission to perform this action",
	},
	NOT_FOUND: {
		status: 404,
		message: "Resource not found",
		data: z.object({
			resourceType: z.string(),
			resourceId: z.number(),
		}),
	},
	CONFLICT: {
		status: 409,
		message: "Resource conflict",
		data: z.object({
			field: z.string(),
			value: z.string(),
		}),
	},
	DOMAIN_RULE_VIOLATION: {
		status: 422,
		message: "Business rule violation",
		data: z.object({
			rule: z.string(),
		}),
	},
});

// ── Payment contracts ──

export const createPaymentContract = base
	.route({
		method: "POST",
		path: "/leases/{leaseId}/payments",
		successStatus: 201,
		summary: "Record a payment",
		description:
			"Records a payment against a lease. Partial rent payments are not accepted and a receipt is auto-generated on success.",
		tags: ["Payments"],
	})
	.input(createPayment)
	.output(paymentOutput);

export const updatePaymentContract = base
	.route({
		method: "PATCH",
		path: "/leases/{leaseId}/payments/{id}",
		summary: "Correct a payment",
		description:
			"Allows correcting metadata (description, method, date) on an existing payment. Amount corrections require creating an adjustment payment instead.",
		tags: ["Payments"],
	})
	.input(updatePayment)
	.output(paymentOutput);

export const getPaymentContract = base
	.route({
		method: "GET",
		path: "/leases/{leaseId}/payments/{id}",
		summary: "Get a payment",
		description: "Retrieves a payment with its attached receipt.",
		tags: ["Payments"],
	})
	.input(paymentInput)
	.output(paymentOutput);

export const listPaymentContract = base
	.route({
		method: "GET",
		path: "/payments",
		summary: "List payments",
		description:
			"Returns a cursor-paginated list of payments. Filter by type to e.g. show only rent payments.",
		tags: ["Payments"],
	})
	.input(listPaymentInput)
	.output(listPaymentOutput);

export const nextRentMonthContract = base
	.route({
		method: "GET",
		path: "/leases/{leaseId}/payments/next-rent-month",
		summary: "Resolve next due rent month",
		description:
			"Returns the next unpaid rent month for the lease as of the provided payment date.",
		tags: ["Payments"],
	})
	.input(nextRentMonthInput)
	.output(nextRentMonthOutput);

// export const listAllPaymentsContract = base
// 	.route({
// 		method: "GET",
// 		path: "/payments",
// 		summary: "List all payments",
// 		description:
// 			"Returns a cursor-paginated list of payments across all leases. Supports filtering by lease, tenant, type, and status.",
// 		tags: ["Payments"],
// 	})
// 	.input(listAllPaymentInput)
// 	.output(listAllPaymentOutput);

// ── Receipt contracts ──

export const getReceiptContract = base
	.route({
		method: "GET",
		path: "/receipts/{id}",
		summary: "Get a receipt",
		description: "Retrieves a receipt by its ID.",
		tags: ["Payment Receipts"],
	})
	.input(receiptInput)
	.output(paymentReceiptOutput);

export const listReceiptsContract = base
	.route({
		method: "GET",
		path: "/leases/{leaseId}/receipts",
		summary: "List receipts for a lease",
		description: "Returns all receipts for a lease, newest first.",
		tags: ["Payment Receipts"],
	})
	.input(listPaymentReceiptInput)
	.output(listPaymentReceiptOutput);
