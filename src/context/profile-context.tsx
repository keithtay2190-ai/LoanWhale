import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

import { useSession } from '@/hooks/use-session';
import { supabase } from '@/lib/supabase';

export type Profile = {
  email: string;
  name: string | null;
  avatarUrl: string | null;
  age: number | null;
  incomeRange: string | null;
  employmentType: string | null;
};

type ProfileContextValue = {
  profile: Profile | null;
  loading: boolean;
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

  const refresh = useCallback(async () => {
    if (!session) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('users')
      .select('email, name, avatar_url, age, income_range, employment_type')
      .eq('id', session.user.id)
      .single();

    if (!error && data) {
      setProfile({
        email: data.email,
        name: data.name,
        avatarUrl: data.avatar_url,
        age: data.age,
        incomeRange: data.income_range,
        employmentType: data.employment_type,
      });
    }
    setLoading(false);
  }, [session]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function updateLocalProfile(patch: Partial<Profile>) {
    setProfile((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  return (
    <ProfileContext.Provider value={{ profile, loading, refresh, updateLocalProfile }}>
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
