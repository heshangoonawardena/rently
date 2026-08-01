export function formatExportDate(date: string) {
	return new Date(date).toLocaleDateString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}

export function formatDisplayDate(date: string) {
	const parsedDate = new Date(date);
	if (Number.isNaN(parsedDate.getTime())) {
		return date;
	}

	return parsedDate.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

export function formatCurrency(amount: number | string) {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "LKR",
	}).format(Number(amount));
}
