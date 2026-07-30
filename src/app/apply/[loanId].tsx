import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const INCOME_RANGES = [
  'Below S$20,000',
  'S$20,000 - S$39,999',
  'S$40,000 - S$79,999',
  'S$80,000 and above',
];

const EMPLOYMENT_TYPES = ['Salaried', 'Self-Employed', 'Business Owner', 'Unemployed'];

export default function EligibilityQuestionnaireScreen() {
  const { loanId } = useLocalSearchParams<{ loanId: string }>();

  const [ageText, setAgeText] = useState('');
  const [incomeRange, setIncomeRange] = useState<string | null>(null);
  const [employmentType, setEmploymentType] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit() {
    const age = Number(ageText);
    if (!Number.isInteger(age) || age < 18 || age > 100) {
      setSubmitError('Enter a valid age between 18 and 100.');
      return;
    }
    if (!incomeRange) {
      setSubmitError('Select an income range.');
      return;
    }
    if (!employmentType) {
      setSubmitError('Select an employment type.');
      return;
    }

    setSubmitError(null);
    setSubmitted(true);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.backLink}>← Back</Text>
      </Pressable>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Eligibility Check</Text>
        <Text style={styles.subtitle}>
          A few quick questions before you continue with your application.
        </Text>

        {submitted ? (
          <View style={styles.confirmationBox}>
            <Text style={styles.confirmationTitle}>✓ Eligibility details recorded</Text>
            <Text style={styles.confirmationText}>
              Document upload is the next step in the application flow (coming in Phase 3.2).
            </Text>
          </View>
        ) : (
          <>
            <FormField label="Age">
              <AgeInput value={ageText} onChangeText={setAgeText} />
            </FormField>

            <FormField label="Annual income range">
              <View style={styles.optionsWrap}>
                {INCOME_RANGES.map((range) => (
                  <OptionPill
                    key={range}
                    label={range}
                    active={incomeRange === range}
                    onPress={() => setIncomeRange(range)}
                  />
                ))}
              </View>
            </FormField>

            <FormField label="Employment type">
              <View style={styles.optionsWrap}>
                {EMPLOYMENT_TYPES.map((type) => (
                  <OptionPill
                    key={type}
                    label={type}
                    active={employmentType === type}
                    onPress={() => setEmploymentType(type)}
                  />
                ))}
              </View>
            </FormField>

            {submitError && <Text style={styles.errorText}>{submitError}</Text>}

            <Pressable style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>Continue</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function OptionPill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.optionPill, active && styles.optionPillActive]}>
      <Text style={[styles.optionPillText, active && styles.optionPillTextActive]}>{label}</Text>
    </Pressable>
  );
}

function AgeInput({
  value,
  onChangeText,
}: {
  value: string;
  onChangeText: (text: string) => void;
}) {
  return (
    <TextInput
      style={styles.input}
      keyboardType="number-pad"
      placeholder="e.g. 30"
      value={value}
      onChangeText={onChangeText}
    />
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
  content: {
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 6,
    marginBottom: 20,
  },
  field: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  optionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
  },
  optionPillActive: {
    backgroundColor: '#111',
  },
  optionPillText: {
    fontSize: 13,
    color: '#333',
  },
  optionPillTextActive: {
    color: '#fff',
  },
  errorText: {
    color: '#c0392b',
    fontSize: 13,
    marginBottom: 12,
  },
  submitButton: {
    backgroundColor: '#111',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  confirmationBox: {
    borderWidth: 1,
    borderColor: '#d5ead5',
    backgroundColor: '#f3faf3',
    borderRadius: 10,
    padding: 16,
  },
  confirmationTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2a7a2a',
  },
  confirmationText: {
    fontSize: 13,
    color: '#3a6a3a',
    marginTop: 6,
    lineHeight: 18,
  },
});
