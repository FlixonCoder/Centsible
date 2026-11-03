/**
 * Standard Equated Monthly Installment (EMI) calculation.
 * Formula: P * r * (1 + r)^n / ((1 + r)^n - 1)
 *
 * @param principal Loan principal amount (P)
 * @param annualRatePercent Annual interest rate as percentage (e.g., 16 for 16% p.a.)
 * @param tenureMonths Loan tenure in months (n)
 */
export function calculateEMI(
  principal: number,
  annualRatePercent: number,
  tenureMonths: number
): number {
  if (principal <= 0 || tenureMonths <= 0) return 0;
  if (annualRatePercent === 0) return principal / tenureMonths;

  const monthlyRate = annualRatePercent / 12 / 100;
  const numerator = principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths);
  const denominator = Math.pow(1 + monthlyRate, tenureMonths) - 1;

  if (denominator === 0) return principal / tenureMonths;
  return numerator / denominator;
}

/**
 * Simulates paying a fixed minimum amount each month on a revolving credit card.
 *
 * @param balance Starting credit card balance
 * @param annualAprPercent e.g., 42% APR
 * @param fixedMonthlyPayment e.g., ₹2,000
 * @param maxMonths Safety cut-off (e.g. 120 months)
 */
export function simulateCreditCardMinimum(
  balance: number,
  annualAprPercent: number = 42,
  fixedMonthlyPayment: number = 2000,
  maxMonths: number = 120
): {
  months: number;
  totalRepaid: number;
  totalInterest: number;
  schedule: Array<{ month: number; balance: number; interest: number; payment: number }>;
} {
  let remaining = balance;
  const monthlyRate = annualAprPercent / 12 / 100; // 0.035 for 42%
  let totalRepaid = 0;
  let totalInterest = 0;
  let months = 0;
  const schedule: Array<{ month: number; balance: number; interest: number; payment: number }> = [];

  while (remaining > 1 && months < maxMonths) {
    months++;
    const interest = remaining * monthlyRate;
    totalInterest += interest;
    let payment = fixedMonthlyPayment;

    if (remaining + interest < payment) {
      payment = remaining + interest;
    }

    const principalPaid = payment - interest;
    remaining = Math.max(0, remaining - principalPaid);
    totalRepaid += payment;

    schedule.push({
      month: months,
      balance: Math.round(remaining),
      interest: Math.round(interest),
      payment: Math.round(payment),
    });
  }

  return {
    months,
    totalRepaid: Math.round(totalRepaid),
    totalInterest: Math.round(totalInterest),
    schedule,
  };
}

