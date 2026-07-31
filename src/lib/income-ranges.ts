// Single source of truth for the income-range brackets used in the profile
// form and in "For You" eligibility matching, so the two never drift apart.
export const INCOME_RANGES = [
  { label: 'Below S$20,000', lowerBound: 0 },
  { label: 'S$20,000 - S$39,999', lowerBound: 20000 },
  { label: 'S$40,000 - S$79,999', lowerBound: 40000 },
  { label: 'S$80,000 and above', lowerBound: 80000 },
] as const;

/**
 * We only know which bracket a user picked, not their exact income, so we
 * compare against the bracket's lower bound - the most conservative reading.
 * This avoids telling someone they're eligible for a loan they might not
 * actually qualify for.
 */
export function incomeRangeLowerBound(label: string | null | undefined): number | null {
  const match = INCOME_RANGES.find((range) => range.label === label);
  return match ? match.lowerBound : null;
}
