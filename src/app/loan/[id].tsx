import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatPercent, formatSGD } from '@/lib/format';
import { supabase } from '@/lib/supabase';
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
      <Pressable onPress={() => router.back()}>
        <Text style={styles.backLink}>← Back</Text>
      </Pressable>

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
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  backLink: {
    fontSize: 15,
    color: '#0066cc',
    marginTop: 8,
    marginBottom: 8,
  },
  centerFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  mutedText: {
    fontSize: 13,
    color: '#888',
  },
  errorText: {
    fontSize: 14,
    color: '#c0392b',
    fontWeight: '600',
  },
  content: {
    paddingBottom: 40,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#eef4ff',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 8,
  },
  typeBadgeText: {
    fontSize: 11,
    color: '#2255aa',
    textTransform: 'capitalize',
  },
  bankName: {
    fontSize: 26,
    fontWeight: '700',
    marginTop: 8,
  },
  rate: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 20,
  },
  stat: {},
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  sectionText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  requirementItem: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
});
