import { type ClassValue, clsx } from "clsx";
import { format } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatEnumLabel(value: string): string {
	return value
		.replace(/_/g, " ")
		.replace(/\b\w/g, (char) => char.toUpperCase());
}

export function getFutureDate(daysToAdd: number) {
	const targetDate = new Date();
	targetDate.setDate(targetDate.getDate() + daysToAdd);
	return format(targetDate, "yyyy-MM-dd");
}

export function getPastDate(daysToSubtract: number) {
	const targetDate = new Date();
	targetDate.setDate(targetDate.getDate() - daysToSubtract);
	return format(targetDate, "yyyy-MM-dd");
}
export function getPastDateTime(daysToSubtract: number) {
	const targetDate = new Date();
	targetDate.setDate(targetDate.getDate() - daysToSubtract);
	return targetDate;
}

export function formatDateOnly(
	date: Date | null | undefined,
): string | undefined {
	if (!date || Number.isNaN(date.getTime())) return undefined;

	const year = date.getFullYear();
	// Pad months and days with leading zeros if they are single digits
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");

	// Forces the exact local calendar date to be saved as midnight UTC
	return `${year}-${month}-${day}T00:00:00.000Z`;
}
