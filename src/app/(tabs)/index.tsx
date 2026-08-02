import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { ScreenHeader } from '@/components/screen-header';
import { useProfile } from '@/context/profile-context';
import { hasSufficientProfileData, isEligibleForLoan } from '@/lib/eligibility';
import { formatPercent, formatSGD } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { colors, fontSize, radii, spacing } from '@/lib/theme';
import type { Tables } from '@/lib/database.types';

type Loan = Tables<'loans'>;
type LoanTypeFilter = 'all' | 'for-you' | 'personal' | 'business';
type SortDirection = 'asc' | 'desc';
type ScreenStatus = 'loading' | 'loaded' | 'error';

export default function LoanComparisonScreen() {
  const { profile, loading: profileLoading } = useProfile();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [status, setStatus] = useState<ScreenStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState<LoanTypeFilter>('all');
  const [bankFilter, setBankFilter] = useState<string | null>(null);
  const [bankMenuOpen, setBankMenuOpen] = useState(false);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

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

  const needsProfileData =
    filter === 'for-you' && !profileLoading && !hasSufficientProfileData(profile);

  const bankOptions = useMemo(
    () => Array.from(new Set(loans.map((loan) => loan.bank_name))).sort(),
    [loans]
  );

  const visibleLoans = useMemo(() => {
    let filtered: Loan[];
    if (filter === 'all') {
      filtered = loans;
    } else if (filter === 'for-you') {
      filtered = profile ? loans.filter((loan) => isEligibleForLoan(loan, profile)) : [];
    } else {
      filtered = loans.filter((loan) => loan.loan_type === filter);
    }

    if (bankFilter) {
      filtered = filtered.filter((loan) => loan.bank_name === bankFilter);
    }

    return [...filtered].sort((a, b) =>
      sortDirection === 'asc'
        ? a.interest_rate - b.interest_rate
        : b.interest_rate - a.interest_rate
    );
  }, [loans, filter, bankFilter, sortDirection, profile]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScreenHeader title="Compare Loans" />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.controlsScroll}
        contentContainerStyle={styles.controlsRow}
      >
        <FilterButton label="All" active={filter === 'all'} onPress={() => setFilter('all')} />
        <FilterButton
          label="For You"
          active={filter === 'for-you'}
          onPress={() => setFilter('for-you')}
        />
        <Pressable
          style={[styles.filterButton, styles.bankButton, bankFilter && styles.filterButtonActive]}
          onPress={() => setBankMenuOpen(true)}
        >
          <Text
            style={[styles.filterButtonText, bankFilter && styles.filterButtonTextActive]}
            numberOfLines={1}
          >
            {bankFilter ?? 'Bank'}
          </Text>
          <Ionicons
            name="chevron-down"
            size={14}
            color={bankFilter ? colors.onDark : colors.textPrimary}
          />
        </Pressable>
        <FilterButton
          label="Personal"
          active={filter === 'personal'}
          onPress={() => setFilter('personal')}
        />
        <FilterButton
          label="Business"
          active={filter === 'business'}
          onPress={() => setFilter('business')}
        />
      </ScrollView>

      <Modal
        visible={bankMenuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setBankMenuOpen(false)}
      >
        <Pressable style={styles.bankBackdrop} onPress={() => setBankMenuOpen(false)}>
          <View style={styles.bankMenu}>
            <Text style={styles.bankMenuTitle}>Filter by bank</Text>
            <ScrollView style={styles.bankMenuList}>
              <Pressable
                style={styles.bankMenuItem}
                onPress={() => {
                  setBankFilter(null);
                  setBankMenuOpen(false);
                }}
              >
                <Text style={styles.bankMenuItemText}>All Banks</Text>
                {!bankFilter && <Ionicons name="checkmark" size={18} color={colors.primary} />}
              </Pressable>
              {bankOptions.map((bank) => (
                <Pressable
                  key={bank}
                  style={styles.bankMenuItem}
                  onPress={() => {
                    setBankFilter(bank);
                    setBankMenuOpen(false);
                  }}
                >
                  <Text style={styles.bankMenuItemText}>{bank}</Text>
                  {bankFilter === bank && (
                    <Ionicons name="checkmark" size={18} color={colors.primary} />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      <Pressable
        style={styles.sortButton}
        onPress={() => setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))}
      >
        <Text style={styles.sortButtonText}>
          Rate: {sortDirection === 'asc' ? 'Low to High' : 'High to Low'} ↕
        </Text>
      </Pressable>

      {filter === 'for-you' && profileLoading && (
        <View style={styles.centerFill}>
          <Text style={styles.mutedText}>Loading your profile…</Text>
        </View>
      )}

      {needsProfileData && (
        <View style={styles.centerFill}>
          <Text style={styles.promptText}>Please update details before proceeding</Text>
          <Text style={styles.mutedText}>
            We need your age and income range to show loans you're eligible for.
          </Text>
          <View style={styles.promptButtonWrap}>
            <PrimaryButton label="Update Details" onPress={() => router.push('/profile')} />
          </View>
        </View>
      )}

      {!needsProfileData && !(filter === 'for-you' && profileLoading) && status === 'loading' && (
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

      {!needsProfileData && status === 'loaded' && visibleLoans.length === 0 && (
        <View style={styles.centerFill}>
          <Text style={styles.mutedText}>No loans match this filter.</Text>
        </View>
      )}

      {!needsProfileData && status === 'loaded' && visibleLoans.length > 0 && (
        <FlatList
          data={visibleLoans}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => <LoanCard loan={item} />}
        />
      )}

      <Text style={styles.demoLabel}>Demo App — Portfolio Project</Text>
    </SafeAreaView>
  );
}

function FilterButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.filterButton, active && styles.filterButtonActive]}
    >
      <Text style={[styles.filterButtonText, active && styles.filterButtonTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function LoanCard({ loan }: { loan: Loan }) {
  const hasQuantumRange = loan.loan_amount_min != null || loan.loan_amount_max != null;

  return (
    <Pressable style={styles.card} onPress={() => router.push(`/loan/${loan.id}`)}>
      <View style={styles.cardHeader}>
        <Text style={styles.bankName}>{loan.bank_name}</Text>
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>{loan.loan_type}</Text>
        </View>
      </View>
      <Text style={styles.rate}>{formatPercent(loan.interest_rate)}</Text>
      <Text style={styles.tenure}>{loan.tenure_months} months tenure</Text>
      {hasQuantumRange && (
        <Text style={styles.quantum}>
          {loan.loan_amount_min != null ? formatSGD(loan.loan_amount_min) : 'S$0'}
          {' - '}
          {loan.loan_amount_max != null ? formatSGD(loan.loan_amount_max) : 'no fixed cap'}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  controlsScroll: {
    flexGrow: 0,
    height: 40,
    marginTop: spacing.md,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  filterButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
  },
  bankButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    maxWidth: 140,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterButtonText: {
    fontSize: fontSize.bodySmall,
    color: colors.textPrimary,
  },
  filterButtonTextActive: {
    color: colors.onDark,
  },
  bankBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bankMenu: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    width: '80%',
    maxHeight: '60%',
  },
  bankMenuTitle: {
    fontSize: fontSize.bodySmall,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  bankMenuList: {
    alignSelf: 'stretch',
  },
  bankMenuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  bankMenuItemText: {
    fontSize: fontSize.body,
    color: colors.textPrimary,
  },
  sortButton: {
    marginTop: spacing.sm + 2,
    alignSelf: 'flex-start',
  },
  sortButtonText: {
    fontSize: fontSize.bodySmall,
    color: colors.accent,
  },
  centerFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: spacing.xxl,
  },
  mutedText: {
    fontSize: fontSize.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  promptText: {
    fontSize: fontSize.h2 - 2,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  promptButtonWrap: {
    marginTop: spacing.md,
  },
  errorText: {
    fontSize: fontSize.h2 - 4,
    color: colors.danger,
    fontWeight: '600',
  },
  listContent: {
    paddingTop: spacing.md,
    paddingBottom: 40,
    gap: spacing.md - 2,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.lg - 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bankName: {
    fontSize: fontSize.body + 1,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  typeBadge: {
    backgroundColor: colors.accentSoft,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  typeBadgeText: {
    fontSize: fontSize.micro,
    color: colors.accent,
    textTransform: 'capitalize',
    fontWeight: '600',
  },
  rate: {
    fontSize: fontSize.h1 - 4,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.sm - 2,
  },
  tenure: {
    fontSize: fontSize.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  quantum: {
    fontSize: fontSize.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  demoLabel: {
    textAlign: 'center',
    fontSize: fontSize.caption,
    color: colors.textMuted,
    paddingVertical: spacing.sm,
  },
});
