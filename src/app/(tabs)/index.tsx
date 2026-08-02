import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProfileMenu } from '@/components/profile-menu';
import { useProfile } from '@/context/profile-context';
import { useSession } from '@/hooks/use-session';
import { hasSufficientProfileData, isEligibleForLoan } from '@/lib/eligibility';
import { formatPercent, formatSGD } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/lib/database.types';

type Loan = Tables<'loans'>;
type LoanTypeFilter = 'all' | 'for-you' | 'personal' | 'business';
type SortDirection = 'asc' | 'desc';
type ScreenStatus = 'loading' | 'loaded' | 'error';

export default function LoanComparisonScreen() {
  const { session } = useSession();
  const { profile, loading: profileLoading } = useProfile();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [status, setStatus] = useState<ScreenStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState<LoanTypeFilter>('all');
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

  const visibleLoans = useMemo(() => {
    let filtered: Loan[];
    if (filter === 'all') {
      filtered = loans;
    } else if (filter === 'for-you') {
      filtered = profile ? loans.filter((loan) => isEligibleForLoan(loan, profile)) : [];
    } else {
      filtered = loans.filter((loan) => loan.loan_type === filter);
    }

    return [...filtered].sort((a, b) =>
      sortDirection === 'asc'
        ? a.interest_rate - b.interest_rate
        : b.interest_rate - a.interest_rate
    );
  }, [loans, filter, sortDirection, profile]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Compare Loans</Text>
        {session ? (
          <ProfileMenu />
        ) : (
          <Pressable onPress={() => router.push('/login')}>
            <Text style={styles.authLink}>Log In</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.controlsRow}>
        <FilterButton label="All" active={filter === 'all'} onPress={() => setFilter('all')} />
        <FilterButton
          label="For You"
          active={filter === 'for-you'}
          onPress={() => setFilter('for-you')}
        />
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
      </View>

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
          <Pressable style={styles.promptButton} onPress={() => router.push('/profile')}>
            <Text style={styles.promptButtonText}>Update Details</Text>
          </Pressable>
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
    backgroundColor: '#fff',
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  authLink: {
    fontSize: 14,
    color: '#0066cc',
    fontWeight: '600',
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  filterButtonActive: {
    backgroundColor: '#111',
  },
  filterButtonText: {
    fontSize: 13,
    color: '#333',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  sortButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  sortButtonText: {
    fontSize: 13,
    color: '#0066cc',
  },
  centerFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 24,
  },
  mutedText: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
  },
  promptText: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  promptButton: {
    backgroundColor: '#111',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 12,
  },
  promptButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 14,
    color: '#c0392b',
    fontWeight: '600',
  },
  listContent: {
    paddingTop: 12,
    paddingBottom: 40,
    gap: 10,
  },
  card: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bankName: {
    fontSize: 16,
    fontWeight: '600',
  },
  typeBadge: {
    backgroundColor: '#eef4ff',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  typeBadgeText: {
    fontSize: 11,
    color: '#2255aa',
    textTransform: 'capitalize',
  },
  rate: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 6,
  },
  tenure: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  quantum: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  demoLabel: {
    textAlign: 'center',
    fontSize: 12,
    color: '#999',
    paddingVertical: 8,
  },
});
