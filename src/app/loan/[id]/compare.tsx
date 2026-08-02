import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatPercent, formatSGD } from '@/lib/format';
import { supabase } from '@/lib/supabase';
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
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 12,
  },
  pickList: {
    gap: 8,
    paddingBottom: 40,
  },
  pickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    padding: 14,
  },
  pickBankName: {
    fontSize: 15,
    fontWeight: '600',
  },
  pickLoanType: {
    fontSize: 12,
    color: '#888',
    textTransform: 'capitalize',
    marginTop: 2,
  },
  pickRate: {
    fontSize: 15,
    fontWeight: '700',
  },
  table: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
  },
  tableCell: {
    flex: 1,
    fontSize: 13,
    color: '#333',
  },
  tableLabelCell: {
    flex: 0.8,
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
  },
  tableHeaderCell: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
  },
});
