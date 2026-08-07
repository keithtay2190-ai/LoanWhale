import AsyncStorage from '@react-native-async-storage/async-storage';

// Holds onboarding answers on-device for guests who skip account creation,
// so "For You" matching still works without an account - only applying for
// a loan requires logging in.
const LOCAL_PROFILE_DRAFT_KEY = 'localProfileDraft';

export type LocalProfileDraft = {
  name: string | null;
  age: number | null;
  incomeRange: string | null;
  employmentType: string | null;
  desiredAmount: number | null;
};

export async function saveLocalProfileDraft(draft: LocalProfileDraft): Promise<void> {
  await AsyncStorage.setItem(LOCAL_PROFILE_DRAFT_KEY, JSON.stringify(draft));
}

export async function getLocalProfileDraft(): Promise<LocalProfileDraft | null> {
  const raw = await AsyncStorage.getItem(LOCAL_PROFILE_DRAFT_KEY);
  return raw ? JSON.parse(raw) : null;
}
