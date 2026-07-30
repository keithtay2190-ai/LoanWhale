import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { formatPercent, formatSGD } from '@/lib/format';
import {
  buildAmortizationSchedule,
  computeEIRPercent,
  computeMonthlyInstalment,
  solveMonthlyEffectiveRate,
} from '@/lib/loan-math';
import type { Tables } from '@/lib/database.types';

type Loan = Tables<'loans'>;

function defaultAmount(loan: Loan): number {
  if (loan.loan_amount_min != null && loan.loan_amount_max != null) {
    return Math.round((loan.loan_amount_min + loan.loan_amount_max) / 2 / 100) * 100;
  }
  return loan.loan_amount_max ?? loan.loan_amount_min ?? 10000;
}

export function RepaymentCalculator({ loan }: { loan: Loan }) {
  const [amountText, setAmountText] = useState(() => String(defaultAmount(loan)));
  const [showSchedule, setShowSchedule] = useState(false);

  const amount = Number(amountText);
  const isValidAmount = Number.isFinite(amount) && amount > 0;

  const result = useMemo(() => {
    if (!isValidAmount) return null;

    const monthlyInstalment = computeMonthlyInstalment(
      amount,
      loan.interest_rate,
      loan.tenure_months
    );
    const monthlyRate = solveMonthlyEffectiveRate(amount, monthlyInstalment, loan.tenure_months);
    const eirPercent = computeEIRPercent(monthlyRate);
    const schedule = buildAmortizationSchedule(
      amount,
      monthlyInstalment,
      monthlyRate,
      loan.tenure_months
    );

    return { monthlyInstalment, eirPercent, schedule };
  }, [amount, isValidAmount, loan.interest_rate, loan.tenure_months]);

  const belowMin = loan.loan_amount_min != null && isValidAmount && amount < loan.loan_amount_min;
  const aboveMax = loan.loan_amount_max != null && isValidAmount && amount > loan.loan_amount_max;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Repayment calculator</Text>

      <Text style={styles.label}>Loan amount</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={amountText}
        onChangeText={setAmountText}
        placeholder="Enter an amount"
      />
      {(belowMin || aboveMax) && (
        <Text style={styles.warningText}>
          This bank's quoted rate assumes an amount within its published range.
        </Text>
      )}

      {!isValidAmount && <Text style={styles.mutedText}>Enter an amount to calculate.</Text>}

      {result && (
        <>
          <View style={styles.statsRow}>
            <View>
              <Text style={styles.statValue}>{formatSGD(result.monthlyInstalment)}</Text>
              <Text style={styles.statLabel}>Monthly instalment</Text>
            </View>
            <View>
              <Text style={styles.statValue}>{formatPercent(result.eirPercent)}</Text>
              <Text style={styles.statLabel}>Effective Interest Rate (EIR)</Text>
            </View>
          </View>

          <Pressable onPress={() => setShowSchedule((v) => !v)}>
            <Text style={styles.toggleLink}>
              {showSchedule ? 'Hide' : 'Show'} amortization schedule
            </Text>
          </Pressable>

          {showSchedule && (
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeaderRow]}>
                <Text style={[styles.tableCell, styles.tableHeaderCell, styles.monthCell]}>
                  Mth
                </Text>
                <Text style={[styles.tableCell, styles.tableHeaderCell]}>Payment</Text>
                <Text style={[styles.tableCell, styles.tableHeaderCell]}>Principal</Text>
                <Text style={[styles.tableCell, styles.tableHeaderCell]}>Interest</Text>
                <Text style={[styles.tableCell, styles.tableHeaderCell]}>Balance</Text>
              </View>
              {result.schedule.map((row) => (
                <View key={row.month} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.monthCell]}>{row.month}</Text>
                  <Text style={styles.tableCell}>{formatSGD(row.payment)}</Text>
                  <Text style={styles.tableCell}>{formatSGD(row.principalPortion)}</Text>
                  <Text style={styles.tableCell}>{formatSGD(row.interestPortion)}</Text>
                  <Text style={styles.tableCell}>{formatSGD(row.balance)}</Text>
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  label: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  warningText: {
    fontSize: 12,
    color: '#b8860b',
    marginTop: 6,
  },
  mutedText: {
    fontSize: 13,
    color: '#888',
    marginTop: 10,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 16,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  toggleLink: {
    fontSize: 13,
    color: '#0066cc',
    marginTop: 16,
  },
  table: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
  },
  tableHeaderRow: {
    backgroundColor: '#fafafa',
  },
  tableCell: {
    flex: 1,
    fontSize: 11,
    color: '#333',
  },
  tableHeaderCell: {
    fontWeight: '700',
    color: '#666',
  },
  monthCell: {
    flex: 0.5,
  },
});
