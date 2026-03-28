import { useContext } from 'react';
import type { RemoteAppProps } from '@workflow/shared-types';
import { AuthContext } from '@/context/authContext';

export function useAuth(): RemoteAppProps {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
