/**
 * Formats numbers into Indian Rupee (INR) style with en-IN grouping.
 * e.g., 154000 -> "₹1,54,000", -2500 -> "-₹2,500"
 */
export function formatINR(amount: number, options?: { showSign?: boolean; showDecimals?: boolean }): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return "₹0";
  }

  const isNegative = amount < 0;
  const absAmount = Math.abs(Math.round(amount));

  const formatted = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: options?.showDecimals ? 2 : 0,
    minimumFractionDigits: options?.showDecimals ? 2 : 0,
  }).format(absAmount);

  if (isNegative) {
    return `-₹${formatted}`;
  }

  if (options?.showSign && amount > 0) {
    return `+₹${formatted}`;
  }

  return `₹${formatted}`;
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

