import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

import { useSession } from '@/hooks/use-session';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { supabase } from '@/lib/supabase';

export type Profile = {
  email: string;
  name: string | null;
  avatarUrl: string | null;
  age: number | null;
  incomeRange: string | null;
  employmentType: string | null;
  desiredAmount: number | null;
};

type ProfileContextValue = {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  // Updates the in-memory profile immediately (e.g. right after a successful
  // save), so every screen showing profile data - the header avatar, Details,
  // anywhere else later - reflects the change without waiting on a refetch.
  updateLocalProfile: (patch: Partial<Profile>) => void;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!session) {
      setProfile(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('users')
      .select('email, name, avatar_url, age, income_range, employment_type, desired_loan_amount')
      .eq('id', session.user.id)
      .single();

    if (fetchError) {
      setError(getFriendlyErrorMessage(fetchError));
      setLoading(false);
      return;
    }

    setProfile({
      email: data.email,
      name: data.name,
      avatarUrl: data.avatar_url,
      age: data.age,
      incomeRange: data.income_range,
      employmentType: data.employment_type,
      desiredAmount: data.desired_loan_amount,
    });
    setLoading(false);
  }, [session]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function updateLocalProfile(patch: Partial<Profile>) {
    setProfile((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  return (
    <ProfileContext.Provider value={{ profile, loading, error, refresh, updateLocalProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
