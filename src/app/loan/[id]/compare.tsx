import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { useProfile } from '@/context/profile-context';
import { hasSufficientProfileData, isEligibleForLoan } from '@/lib/eligibility';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { formatPercent, formatSGD } from '@/lib/format';
import { computeMonthlyInstalment } from '@/lib/loan-math';
import { supabase } from '@/lib/supabase';
import { colors, fontSize, radii, spacing } from '@/lib/theme';
import type { Tables } from '@/lib/database.types';

type Loan = Tables<'loans'>;
type ScreenStatus = 'loading' | 'loaded' | 'error';

function quantumText(loan: Loan) {
  if (loan.loan_amount_min == null && loan.loan_amount_max == null) return '—';
  return `${loan.loan_amount_min != null ? formatSGD(loan.loan_amount_min) : 'S$0'} - ${
    loan.loan_amount_max != null ? formatSGD(loan.loan_amount_max) : 'no fixed cap'
  }`;
}

function repaymentFigures(loan: Loan, desiredAmount: number) {
  const monthlyInstalment = computeMonthlyInstalment(
    desiredAmount,
    loan.interest_rate,
    loan.tenure_months
  );
  const totalCost = monthlyInstalment * loan.tenure_months + loan.processing_fee;
  return { monthlyInstalment, totalCost };
}

export default function CompareLoanScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useProfile();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [status, setStatus] = useState<ScreenStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [otherLoanId, setOtherLoanId] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const [forYouOnly, setForYouOnly] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadLoans() {
      setStatus('loading');
      const { data, error } = await supabase.from('loans').select('*');
      if (cancelled) return;

      if (error) {
        setErrorMessage(getFriendlyErrorMessage(error));
        setStatus('error');
        return;
      }
      setLoans(data ?? []);
      setStatus('loaded');
    }

    loadLoans();
    return () => {
      cancelled = true;
    };
  }, [retryToken]);

  const currentLoan = loans.find((loan) => loan.id === id) ?? null;
  const otherLoan = loans.find((loan) => loan.id === otherLoanId) ?? null;
  const pickableLoans = loans.filter((loan) => loan.id !== id);

  const needsProfileData = forYouOnly && !hasSufficientProfileData(profile);
  const visiblePickableLoans =
    forYouOnly && profile && hasSufficientProfileData(profile)
      ? pickableLoans.filter((loan) => isEligibleForLoan(loan, profile))
      : pickableLoans;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Pressable
        onPress={() => (otherLoan ? setOtherLoanId(null) : router.back())}
        style={({ pressed }) => pressed && styles.linkPressed}
        accessibilityRole="button"
        accessibilityLabel={otherLoan ? 'Change comparison loan' : 'Back'}
      >
        <Text style={styles.backLink}>← {otherLoan ? 'Change' : 'Back'}</Text>
      </Pressable>

      {status === 'loading' && (
        <View style={styles.centerFill}>
          <Text style={styles.mutedText}>Loading loans…</Text>
        </View>
      )}

      {status === 'error' && (
        <View style={styles.centerFill}>
          <Text style={styles.errorText}>Couldn't load loans.</Text>
          <Text style={styles.mutedText}>{errorMessage}</Text>
          <View style={styles.retryButtonWrap}>
            <PrimaryButton label="Try Again" onPress={() => setRetryToken((t) => t + 1)} />
          </View>
        </View>
      )}

      {status === 'loaded' && currentLoan && !otherLoan && (
        <>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Compare with…</Text>
            <Pressable
              onPress={() => setForYouOnly((v) => !v)}
              style={({ pressed }) => [
                styles.forYouPill,
                forYouOnly && styles.forYouPillActive,
                pressed && styles.forYouPillPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Filter to loans you're eligible for"
              accessibilityState={{ selected: forYouOnly }}
            >
              <Text style={[styles.forYouPillText, forYouOnly && styles.forYouPillTextActive]}>
                For You
              </Text>
            </Pressable>
          </View>

          {needsProfileData ? (
            <View style={styles.centerFill}>
              <Text style={styles.promptText}>Please update details before proceeding</Text>
              <Text style={styles.mutedText}>
                We need your age and income range to show loans you're eligible for.
              </Text>
              <View style={styles.retryButtonWrap}>
                <PrimaryButton label="Update Details" onPress={() => router.push('/profile')} />
              </View>
            </View>
          ) : visiblePickableLoans.length === 0 ? (
            <View style={styles.centerFill}>
              <Text style={styles.mutedText}>No eligible loans to compare with.</Text>
            </View>
          ) : (
            <FlatList
              data={visiblePickableLoans}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.pickList}
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [styles.pickRow, pressed && styles.pickRowPressed]}
                  onPress={() => setOtherLoanId(item.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Compare with ${item.bank_name} ${item.loan_type} loan`}
                >
                  <View>
                    <Text style={styles.pickBankName}>{item.bank_name}</Text>
                    <Text style={styles.pickLoanType}>{item.loan_type}</Text>
                  </View>
                  <Text style={styles.pickRate}>{formatPercent(item.interest_rate)}</Text>
                </Pressable>
              )}
            />
          )}
        </>
      )}

      {status === 'loaded' && currentLoan && otherLoan && (
        <>
          {profile?.desiredAmount != null ? (
            <View style={styles.quantumHero}>
              <Text style={styles.quantumHeroLabel}>You're looking for</Text>
              <Text style={styles.quantumHeroValue}>{formatSGD(profile.desiredAmount)}</Text>
            </View>
          ) : (
            <View style={styles.centerFill}>
              <Text style={styles.promptText}>Please update details before proceeding</Text>
              <Text style={styles.mutedText}>
                Set the loan amount you're looking for to see monthly repayment and total cost.
              </Text>
              <View style={styles.retryButtonWrap}>
                <PrimaryButton label="Update Details" onPress={() => router.push('/profile')} />
              </View>
            </View>
          )}

          <View style={styles.table}>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.tableLabelCell]} />
              <Text style={[styles.tableCell, styles.tableHeaderCell]}>
                {currentLoan.bank_name}
              </Text>
              <Text style={[styles.tableCell, styles.tableHeaderCell]}>{otherLoan.bank_name}</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.tableLabelCell]}>Rate</Text>
              <Text style={styles.tableCell}>{formatPercent(currentLoan.interest_rate)}</Text>
              <Text style={styles.tableCell}>{formatPercent(otherLoan.interest_rate)}</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.tableLabelCell]}>Tenure</Text>
              <Text style={styles.tableCell}>{currentLoan.tenure_months} months</Text>
              <Text style={styles.tableCell}>{otherLoan.tenure_months} months</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.tableLabelCell]}>Loan amount</Text>
              <Text style={styles.tableCell}>{quantumText(currentLoan)}</Text>
              <Text style={styles.tableCell}>{quantumText(otherLoan)}</Text>
            </View>

            {profile?.desiredAmount != null && (
              <>
                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.tableLabelCell]}>Monthly repayment</Text>
                  <Text style={styles.tableCell}>
                    {formatSGD(repaymentFigures(currentLoan, profile.desiredAmount).monthlyInstalment)}
                  </Text>
                  <Text style={styles.tableCell}>
                    {formatSGD(repaymentFigures(otherLoan, profile.desiredAmount).monthlyInstalment)}
                  </Text>
                </View>

                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.tableLabelCell]}>Total cost of loan</Text>
                  <Text style={styles.tableCell}>
                    {formatSGD(repaymentFigures(currentLoan, profile.desiredAmount).totalCost)}
                  </Text>
                  <Text style={styles.tableCell}>
                    {formatSGD(repaymentFigures(otherLoan, profile.desiredAmount).totalCost)}
                  </Text>
                </View>
              </>
            )}
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
  },
  backLink: {
    fontSize: fontSize.body,
    color: colors.accent,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  linkPressed: {
    opacity: 0.6,
  },
  centerFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: spacing.xl,
  },
  retryButtonWrap: {
    marginTop: spacing.md,
  },
  mutedText: {
    fontSize: fontSize.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  errorText: {
    fontSize: fontSize.h2 - 4,
    color: colors.danger,
    fontWeight: '600',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.h2 + 2,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  forYouPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
  },
  forYouPillActive: {
    backgroundColor: colors.primary,
  },
  forYouPillPressed: {
    opacity: 0.7,
  },
  forYouPillText: {
    fontSize: fontSize.bodySmall,
    color: colors.textPrimary,
  },
  forYouPillTextActive: {
    color: colors.onDark,
  },
  promptText: {
    fontSize: fontSize.h2 - 2,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  quantumHero: {
    alignItems: 'center',
    backgroundColor: colors.accentSoft,
    borderRadius: radii.lg,
    paddingVertical: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  quantumHeroLabel: {
    fontSize: fontSize.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  quantumHeroValue: {
    fontSize: fontSize.hero,
    fontWeight: '800',
    color: colors.primary,
    marginTop: spacing.xs,
  },
  pickList: {
    gap: spacing.sm,
    paddingBottom: 40,
  },
  pickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.lg - 2,
  },
  pickRowPressed: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
  },
  pickBankName: {
    fontSize: fontSize.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  pickLoanType: {
    fontSize: fontSize.caption,
    color: colors.textSecondary,
    textTransform: 'capitalize',
    marginTop: 2,
  },
  pickRate: {
    fontSize: fontSize.body,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  table: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableCell: {
    flex: 1,
    fontSize: fontSize.bodySmall,
    color: colors.textPrimary,
  },
  tableLabelCell: {
    flex: 0.8,
    fontSize: fontSize.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  tableHeaderCell: {
    fontSize: fontSize.bodySmall + 1,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});
