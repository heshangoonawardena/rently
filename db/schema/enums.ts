import { pgEnum } from "drizzle-orm/pg-core";

export const unitTypeEnum = pgEnum("unit_type", [
  "room",
  "house",
  "warehouse",
  "land",
]);

export const unitStatusEnum = pgEnum("unit_status", [
  "available",
  "occupied",
  "maintenance",
  "inactive",
]);

export const utilityBillingModeEnum = pgEnum("utility_billing_mode", [
  "tenant_managed",
  "fixed_charge",
  "metered",
]);

export const leaseStatusEnum = pgEnum("lease_status", [
  "active",
  "ended",
  "terminated",
]);

export const paymentTypeEnum = pgEnum("payment_type", [
  "deposit",
  "deposit_deduction",
  "rent",
  "partial_rent",
  "arrear",
  "refund",
  "other",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "cash",
  "bank_transfer",
  "cheque",
  "online",
  "other",
]);

export const utilityTypeEnum = pgEnum("utility_type", [
  "electricity",
  "water",
  "tax",
  "other",
]);

export const utilityStatusEnum = pgEnum("utility_status", [
  "active",
  "inactive",
]);

export const utilityBillStatusEnum = pgEnum("utility_bill_status", [
  "draft",
  "issued",
  "paid",
  "warned",
  "overdue",
]);

export const repairTypeEnum = pgEnum("repair_type", [
  "plumbing",
  "electrical",
  "structural",
  "other",
]);

export const repairPriorityEnum = pgEnum("repair_priority", [
  "low",
  "medium",
  "high",
  "urgent",
]);

export const repairStatusEnum = pgEnum("repair_status", [
  "open",
  "in_progress",
  "resolved",
  "cancelled",
]);

export const inspectionStatusEnum = pgEnum("inspection_status", [
  "scheduled",
  "completed",
  "skipped",
]);

export const documentStatusEnum = pgEnum("document_status", [
  "active",
  "expired",
  "superseded",
]);
