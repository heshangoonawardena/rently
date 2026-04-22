import { oc } from "@orpc/contract";
import z from "zod";
import {
	CreatePayment,
	ListPaymentInput,
	ListPaymentOutput,
	PaymentInput,
	PaymentOutput,
	UpdatePayment,
} from "../schemas/payment.schema";
import {
	ListPaymentReceiptInput,
	ListPaymentReceiptOutput,
	PaymentReceiptOutput,
	ReceiptInput,
} from "../schemas/payment.receipt.schema";

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
			"Records a payment against a lease. balanceAfter is calculated server-side from the running balance — do not pass it from the client. A receipt is auto-generated and returned.",
		tags: ["Payments"],
	})
	.input(CreatePayment)
	.output(PaymentOutput);

export const updatePaymentContract = base
	.route({
		method: "PATCH",
		path: "/leases/{leaseId}/payments/{id}",
		summary: "Correct a payment",
		description:
			"Allows correcting metadata (description, method, date) on an existing payment. Amount corrections require creating an adjustment payment instead.",
		tags: ["Payments"],
	})
	.input(UpdatePayment)
	.output(PaymentOutput);

export const getPaymentContract = base
	.route({
		method: "GET",
		path: "/leases/{leaseId}/payments/{id}",
		summary: "Get a payment",
		description: "Retrieves a payment with its attached receipt.",
		tags: ["Payments"],
	})
	.input(PaymentInput)
	.output(PaymentOutput);

export const listPaymentContract = base
	.route({
		method: "GET",
		path: "/leases/{leaseId}/payments",
		summary: "List payments for a lease",
		description:
			"Returns a cursor-paginated list of payments. Filter by type to e.g. show only rent payments.",
		tags: ["Payments"],
	})
	.input(ListPaymentInput)
	.output(ListPaymentOutput);

// ── Receipt contracts ──

export const getReceiptContract = base
	.route({
		method: "GET",
		path: "/receipts/{id}",
		summary: "Get a receipt",
		description: "Retrieves a receipt by its ID.",
		tags: ["Payment Receipts"],
	})
	.input(ReceiptInput)
	.output(PaymentReceiptOutput);

export const listReceiptsContract = base
	.route({
		method: "GET",
		path: "/leases/{leaseId}/receipts",
		summary: "List receipts for a lease",
		description: "Returns all receipts for a lease, newest first.",
		tags: ["Payment Receipts"],
	})
	.input(ListPaymentReceiptInput)
	.output(ListPaymentReceiptOutput);
