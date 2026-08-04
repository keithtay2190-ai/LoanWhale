import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { ScreenHeader } from '@/components/screen-header';
import { useSession } from '@/hooks/use-session';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { supabase } from '@/lib/supabase';
import { colors, fontSize, radii, spacing } from '@/lib/theme';
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
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);

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
        setErrorMessage(getFriendlyErrorMessage(error));
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
  }, [session, sessionLoading, retryToken]);

  function confirmCancel(applicationId: string) {
    Alert.alert(
      'Cancel application?',
      'This removes your application. You can apply again later if you change your mind.',
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Cancel Application',
          style: 'destructive',
          onPress: async () => {
            setCancellingId(applicationId);
            const { error } = await supabase
              .from('applications')
              .delete()
              .eq('id', applicationId);
            setCancellingId(null);

            if (error) {
              Alert.alert("Couldn't cancel application", getFriendlyErrorMessage(error));
              return;
            }
            setApplications((prev) => prev.filter((a) => a.id !== applicationId));
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScreenHeader title="Application Status" />

      {!sessionLoading && !session && (
        <View style={styles.centerFill}>
          <Text style={styles.promptText}>Log in to see your applications</Text>
          <View style={styles.promptButtonWrap}>
            <PrimaryButton label="Log In" onPress={() => router.push('/login')} />
          </View>
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
          <View style={styles.promptButtonWrap}>
            <PrimaryButton label="Try Again" onPress={() => setRetryToken((t) => t + 1)} />
          </View>
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
            <ApplicationCard
              key={application.id}
              application={application}
              onCancel={confirmCancel}
              cancelling={cancellingId === application.id}
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function ApplicationCard({
  application,
  onCancel,
  cancelling,
}: {
  application: ApplicationWithLoan;
  onCancel: (applicationId: string) => void;
  cancelling: boolean;
}) {
  const isRejected = application.status === 'Rejected';
  const currentStageIndex = STAGES.indexOf(
    application.status as (typeof STAGES)[number]
  );

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => router.push(`/loan/${application.loan_id}`)}
      accessibilityRole="button"
      accessibilityLabel={`${application.loans?.bank_name ?? 'Loan'} application, status ${application.status}`}
    >
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

      <Pressable
        style={({ pressed }) => [styles.cancelButton, pressed && !cancelling && styles.cancelButtonPressed]}
        onPress={() => onCancel(application.id)}
        disabled={cancelling}
        accessibilityRole="button"
        accessibilityLabel="Cancel application"
        accessibilityState={{ disabled: cancelling, busy: cancelling }}
      >
        <Text style={styles.cancelButtonText}>
          {cancelling ? 'Cancelling…' : 'Cancel Application'}
        </Text>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
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
  errorText: {
    fontSize: fontSize.h2 - 4,
    color: colors.danger,
    fontWeight: '600',
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
  list: {
    paddingTop: spacing.md,
    paddingBottom: 40,
    gap: spacing.md,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.lg - 2,
  },
  cardPressed: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
  },
  bankName: {
    fontSize: fontSize.body + 1,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  loanType: {
    fontSize: fontSize.caption,
    color: colors.textSecondary,
    textTransform: 'capitalize',
    marginTop: 2,
    marginBottom: spacing.md + 2,
  },
  rejectedText: {
    fontSize: fontSize.h2 - 4,
    color: colors.danger,
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
    backgroundColor: colors.border,
    marginBottom: spacing.xs + 2,
  },
  stepDotActive: {
    backgroundColor: colors.primary,
  },
  stepLabel: {
    fontSize: fontSize.micro,
    color: colors.textMuted,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: spacing.md,
    paddingTop: spacing.md - 2,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  cancelButtonPressed: {
    opacity: 0.6,
  },
  cancelButtonText: {
    fontSize: fontSize.bodySmall,
    color: colors.danger,
    fontWeight: '600',
  },
});
