import { incomeRangeLowerBound } from '@/lib/income-ranges';
import type { Profile } from '@/context/profile-context';
import type { Tables } from '@/lib/database.types';

type Loan = Tables<'loans'>;

/**
 * We don't collect any business-specific criteria (turnover, years operating,
 * shareholding), so business loans can't be genuinely matched against a
 * profile. Business Owner is used as a loose proxy instead: if that's the
 * user's employment type, all business loans are considered "for them".
 */
export function isEligibleForLoan(loan: Loan, profile: Profile): boolean {
  if (loan.loan_type === 'business') {
    if (profile.employmentType !== 'Business Owner') return false;
    return matchesDesiredAmount(loan, profile);
  }

  if (loan.min_age != null && (profile.age == null || profile.age < loan.min_age)) {
    return false;
  }
  if (loan.max_age != null && (profile.age == null || profile.age > loan.max_age)) {
    return false;
  }
  if (loan.min_income_annual != null) {
    const bound = incomeRangeLowerBound(profile.incomeRange);
    if (bound == null || bound < loan.min_income_annual) {
      return false;
    }
  }

  return matchesDesiredAmount(loan, profile);
}

/** Optional filter: if the user set a desired loan amount, only match loans whose range covers it. */
function matchesDesiredAmount(loan: Loan, profile: Profile): boolean {
  if (profile.desiredAmount == null) return true;
  if (loan.loan_amount_min != null && profile.desiredAmount < loan.loan_amount_min) return false;
  if (loan.loan_amount_max != null && profile.desiredAmount > loan.loan_amount_max) return false;
  return true;
}

/** Minimum profile data needed before "For You" can evaluate anything. */
export function hasSufficientProfileData(profile: Profile | null): boolean {
  return profile != null && profile.age != null && profile.incomeRange != null;
}
