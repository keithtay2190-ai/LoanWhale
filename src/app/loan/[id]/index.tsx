import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RepaymentCalculator } from '@/components/repayment-calculator';
import { formatPercent, formatSGD } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { colors, fontSize, radii, spacing } from '@/lib/theme';
import type { Tables } from '@/lib/database.types';

type Loan = Tables<'loans'>;
type ScreenStatus = 'loading' | 'loaded' | 'error';

export default function LoanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loan, setLoan] = useState<Loan | null>(null);
  const [status, setStatus] = useState<ScreenStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadLoan() {
      setStatus('loading');
      const { data, error } = await supabase.from('loans').select('*').eq('id', id).single();
      if (cancelled) return;

      if (error) {
        setErrorMessage(error.message);
        setStatus('error');
        return;
      }
      setLoan(data);
      setStatus('loaded');
    }

    if (id) loadLoan();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLink}>← Back</Text>
        </Pressable>
        <Pressable onPress={() => router.push(`/loan/${id}/compare`)}>
          <Text style={styles.compareLink}>Compare</Text>
        </Pressable>
      </View>

      {status === 'loading' && (
        <View style={styles.centerFill}>
          <Text style={styles.mutedText}>Loading loan…</Text>
        </View>
      )}

      {status === 'error' && (
        <View style={styles.centerFill}>
          <Text style={styles.errorText}>Couldn't load this loan.</Text>
          <Text style={styles.mutedText}>{errorMessage}</Text>
        </View>
      )}

      {status === 'loaded' && loan && (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{loan.loan_type}</Text>
          </View>
          <Text style={styles.bankName}>{loan.bank_name}</Text>
          <Text style={styles.rate}>{formatPercent(loan.interest_rate)}</Text>

          <View style={styles.statsRow}>
            <Stat label="Tenure" value={`${loan.tenure_months} months`} />
            <Stat
              label="Processing fee"
              value={loan.processing_fee > 0 ? formatSGD(loan.processing_fee) : 'None'}
            />
          </View>

          {(loan.loan_amount_min != null || loan.loan_amount_max != null) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Loan amount</Text>
              <Text style={styles.sectionText}>
                {loan.loan_amount_min != null ? formatSGD(loan.loan_amount_min) : 'S$0'}
                {' - '}
                {loan.loan_amount_max != null ? formatSGD(loan.loan_amount_max) : 'no fixed cap'}
              </Text>
            </View>
          )}

          {loan.requirements.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Requirements</Text>
              {loan.requirements.map((requirement) => (
                <Text key={requirement} style={styles.requirementItem}>
                  •  {requirement}
                </Text>
              ))}
            </View>
          )}

          {loan.eligibility_notes && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <Text style={styles.sectionText}>{loan.eligibility_notes}</Text>
            </View>
          )}

          <RepaymentCalculator loan={loan} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  backLink: {
    fontSize: fontSize.body,
    color: colors.accent,
  },
  compareLink: {
    fontSize: fontSize.body,
    color: colors.accent,
    fontWeight: '600',
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
  content: {
    paddingBottom: 40,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accentSoft,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginTop: spacing.sm,
  },
  typeBadgeText: {
    fontSize: fontSize.micro,
    color: colors.accent,
    textTransform: 'capitalize',
    fontWeight: '600',
  },
  bankName: {
    fontSize: fontSize.display - 2,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  rate: {
    fontSize: fontSize.h1 - 4,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.xxl,
    marginTop: spacing.xl,
  },
  stat: {},
  statValue: {
    fontSize: fontSize.body + 1,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: fontSize.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  section: {
    marginTop: spacing.xxl,
  },
  sectionTitle: {
    fontSize: fontSize.bodySmall + 1,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm - 2,
  },
  sectionText: {
    fontSize: fontSize.bodySmall + 1,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  requirementItem: {
    fontSize: fontSize.bodySmall + 1,
    color: colors.textPrimary,
    lineHeight: 22,
  },
});
