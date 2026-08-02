import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { useSession } from '@/hooks/use-session';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/lib/database.types';

const STAGES = ['Submitted', 'Under Review', 'Approved'] as const;

type ApplicationWithLoan = Tables<'applications'> & {
  loans: Pick<Tables<'loans'>, 'bank_name' | 'loan_type'> | null;
};

type ScreenStatus = 'loading' | 'loaded' | 'error';

export default function StatusTrackerScreen() {
  const { session, loading: sessionLoading } = useSession();
  const [applications, setApplications] = useState<ApplicationWithLoan[]>([]);
  const [status, setStatus] = useState<ScreenStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (sessionLoading || !session) return;
    let cancelled = false;

    async function loadApplications() {
      setStatus('loading');
      const { data, error } = await supabase
        .from('applications')
        .select('*, loans(bank_name, loan_type)')
        .eq('user_id', session!.user.id)
        .order('submitted_at', { ascending: false });
      if (cancelled) return;

      if (error) {
        setErrorMessage(error.message);
        setStatus('error');
        return;
      }
      setApplications((data as ApplicationWithLoan[]) ?? []);
      setStatus('loaded');
    }

    loadApplications();
    return () => {
      cancelled = true;
    };
  }, [session, sessionLoading]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScreenHeader title="Application Status" />

      {!sessionLoading && !session && (
        <View style={styles.centerFill}>
          <Text style={styles.promptText}>Log in to see your applications</Text>
          <Pressable style={styles.promptButton} onPress={() => router.push('/login')}>
            <Text style={styles.promptButtonText}>Log In</Text>
          </Pressable>
        </View>
      )}

      {session && status === 'loading' && (
        <View style={styles.centerFill}>
          <Text style={styles.mutedText}>Loading applications…</Text>
        </View>
      )}

      {session && status === 'error' && (
        <View style={styles.centerFill}>
          <Text style={styles.errorText}>Couldn't load applications.</Text>
          <Text style={styles.mutedText}>{errorMessage}</Text>
        </View>
      )}

      {session && status === 'loaded' && applications.length === 0 && (
        <View style={styles.centerFill}>
          <Text style={styles.mutedText}>No applications yet.</Text>
        </View>
      )}

      {session && status === 'loaded' && applications.length > 0 && (
        <ScrollView contentContainerStyle={styles.list}>
          {applications.map((application) => (
            <ApplicationCard key={application.id} application={application} />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function ApplicationCard({ application }: { application: ApplicationWithLoan }) {
  const isRejected = application.status === 'Rejected';
  const currentStageIndex = STAGES.indexOf(
    application.status as (typeof STAGES)[number]
  );

  return (
    <View style={styles.card}>
      <Text style={styles.bankName}>{application.loans?.bank_name ?? 'Loan'}</Text>
      <Text style={styles.loanType}>{application.loans?.loan_type}</Text>

      {isRejected ? (
        <Text style={styles.rejectedText}>Rejected</Text>
      ) : (
        <View style={styles.stepperRow}>
          {STAGES.map((stage, index) => (
            <View key={stage} style={styles.step}>
              <View
                style={[
                  styles.stepDot,
                  index <= currentStageIndex && styles.stepDotActive,
                ]}
              />
              <Text
                style={[
                  styles.stepLabel,
                  index <= currentStageIndex && styles.stepLabelActive,
                ]}
              >
                {stage}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
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
  errorText: {
    fontSize: 14,
    color: '#c0392b',
    fontWeight: '600',
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
  list: {
    paddingTop: 12,
    paddingBottom: 40,
    gap: 12,
  },
  card: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    padding: 14,
  },
  bankName: {
    fontSize: 16,
    fontWeight: '600',
  },
  loanType: {
    fontSize: 12,
    color: '#888',
    textTransform: 'capitalize',
    marginTop: 2,
    marginBottom: 14,
  },
  rejectedText: {
    fontSize: 14,
    color: '#c0392b',
    fontWeight: '600',
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  step: {
    alignItems: 'center',
    flex: 1,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ddd',
    marginBottom: 6,
  },
  stepDotActive: {
    backgroundColor: '#111',
  },
  stepLabel: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
  },
  stepLabelActive: {
    color: '#111',
    fontWeight: '600',
  },
});
