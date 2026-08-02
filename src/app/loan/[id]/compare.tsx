import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatPercent, formatSGD } from '@/lib/format';
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

export default function CompareLoanScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [status, setStatus] = useState<ScreenStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [otherLoanId, setOtherLoanId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadLoans() {
      setStatus('loading');
      const { data, error } = await supabase.from('loans').select('*');
      if (cancelled) return;

      if (error) {
        setErrorMessage(error.message);
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
  }, []);

  const currentLoan = loans.find((loan) => loan.id === id) ?? null;
  const otherLoan = loans.find((loan) => loan.id === otherLoanId) ?? null;
  const pickableLoans = loans.filter((loan) => loan.id !== id);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Pressable onPress={() => (otherLoan ? setOtherLoanId(null) : router.back())}>
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
        </View>
      )}

      {status === 'loaded' && currentLoan && !otherLoan && (
        <>
          <Text style={styles.title}>Compare with…</Text>
          <FlatList
            data={pickableLoans}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.pickList}
            renderItem={({ item }) => (
              <Pressable style={styles.pickRow} onPress={() => setOtherLoanId(item.id)}>
                <View>
                  <Text style={styles.pickBankName}>{item.bank_name}</Text>
                  <Text style={styles.pickLoanType}>{item.loan_type}</Text>
                </View>
                <Text style={styles.pickRate}>{formatPercent(item.interest_rate)}</Text>
              </Pressable>
            )}
          />
        </>
      )}

      {status === 'loaded' && currentLoan && otherLoan && (
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.tableLabelCell]} />
            <Text style={[styles.tableCell, styles.tableHeaderCell]}>{currentLoan.bank_name}</Text>
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
        </View>
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
  centerFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  mutedText: {
    fontSize: fontSize.bodySmall,
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: fontSize.h2 - 4,
    color: colors.danger,
    fontWeight: '600',
  },
  title: {
    fontSize: fontSize.h2 + 2,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
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
