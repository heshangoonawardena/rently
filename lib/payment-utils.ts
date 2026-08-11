export function resolveDepositBalanceDelta(
	paymentType: string,
	paymentAmount: number,
): number {
	if (paymentType === "deposit") return paymentAmount;
	if (paymentType === "deposit_deduction") return -paymentAmount;
	return 0;
}

export function resolveMaximumDepositDeduction(
	depositBalance: number,
	rentAmount: number,
): number {
	return Math.max(0, depositBalance - rentAmount);
}
