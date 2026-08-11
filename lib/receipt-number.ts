
export const RECEIPT_NUMBER_REGEX = /^RCP-(\d{4})-(\d{5})$/;

export const RECEIPT_NUMBER_FORMAT_MESSAGE =
	"Receipt number must follow the RCP-****-***** format";

export function isValidReceiptNumber(value: string): boolean {
	return RECEIPT_NUMBER_REGEX.test(value);
}

export function generateNextReceiptNumber(
	previousReceiptNumber?: string | null,
	now: Date = new Date(),
): string {
	const year = now.getFullYear();
	const nextYearPrefix = `RCP-${year}-`;

	if (!previousReceiptNumber) {
		return `${nextYearPrefix}00001`;
	}

	const match = RECEIPT_NUMBER_REGEX.exec(previousReceiptNumber);
	if (!match) {
		return `${nextYearPrefix}00001`;
	}

	const [, receiptYear, receiptSequence] = match;
	if (Number(receiptYear) !== year) {
		return `${nextYearPrefix}00001`;
	}

	const nextSequence = Number(receiptSequence) + 1;
	if (nextSequence > 99999) {
		throw new Error(`Receipt number sequence exhausted for ${year}`);
	}

	return `${nextYearPrefix}${String(nextSequence).padStart(5, "0")}`;
}
