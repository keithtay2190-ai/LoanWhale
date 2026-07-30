// Singapore banks quote loans using a "flat rate": interest is calculated once on
// the original principal and spread evenly across every instalment. But money is
// actually borrowed on a reducing balance (you owe less each month), so the flat
// rate understates the real cost. The Effective Interest Rate (EIR) is the
// reducing-balance rate that would produce the *same* fixed monthly instalment.
// That's why a 1.48% p.a. flat rate can carry a 3.22% p.a. EIR for the same loan.

export type AmortizationRow = {
  month: number;
  payment: number;
  principalPortion: number;
  interestPortion: number;
  balance: number;
};

/** Step 1: the fixed monthly instalment a flat-rate loan actually charges. */
export function computeMonthlyInstalment(
  principal: number,
  flatRatePercent: number,
  tenureMonths: number
): number {
  const flatRate = flatRatePercent / 100;
  const totalInterest = principal * flatRate * (tenureMonths / 12);
  return (principal + totalInterest) / tenureMonths;
}

/**
 * Step 2: solve for the monthly reducing-balance rate `i` that makes this same
 * fixed instalment fully repay the principal over `tenureMonths` payments, i.e.
 * solve for i in: principal = instalment * (1 - (1+i)^-n) / i
 *
 * There's no closed-form solution for i, so we use bisection: the present value
 * of the instalments is strictly decreasing as the rate increases, so we can
 * narrow in on the root by repeatedly halving the search range.
 */
export function solveMonthlyEffectiveRate(
  principal: number,
  monthlyInstalment: number,
  tenureMonths: number
): number {
  const presentValueAt = (rate: number) => {
    if (rate === 0) return monthlyInstalment * tenureMonths;
    return (monthlyInstalment * (1 - Math.pow(1 + rate, -tenureMonths))) / rate;
  };

  let low = 0;
  let high = 2; // 200% per month is far beyond any realistic loan; safe upper bound
  for (let i = 0; i < 100; i++) {
    const mid = (low + high) / 2;
    if (presentValueAt(mid) > principal) {
      low = mid;
    } else {
      high = mid;
    }
  }
  return (low + high) / 2;
}

/** Step 3: annualize the monthly effective rate into the EIR (% p.a.) banks quote. */
export function computeEIRPercent(monthlyEffectiveRate: number): number {
  return (Math.pow(1 + monthlyEffectiveRate, 12) - 1) * 100;
}

/**
 * Step 4: build the reducing-balance amortization schedule using the effective
 * monthly rate from step 2. Each month, interest is charged only on what's still
 * owed, and the rest of the fixed instalment pays down principal.
 */
export function buildAmortizationSchedule(
  principal: number,
  monthlyInstalment: number,
  monthlyEffectiveRate: number,
  tenureMonths: number
): AmortizationRow[] {
  const rows: AmortizationRow[] = [];
  let balance = principal;

  for (let month = 1; month <= tenureMonths; month++) {
    const interestPortion = balance * monthlyEffectiveRate;
    let principalPortion = monthlyInstalment - interestPortion;
    let payment = monthlyInstalment;

    // Last instalment: clear whatever's left instead of compounding rounding drift.
    if (month === tenureMonths) {
      principalPortion = balance;
      payment = principalPortion + interestPortion;
    }

    balance = Math.max(0, balance - principalPortion);
    rows.push({ month, payment, principalPortion, interestPortion, balance });
  }

  return rows;
}
