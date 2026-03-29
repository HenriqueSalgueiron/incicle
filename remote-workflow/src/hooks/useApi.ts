import { useMemo } from 'react';
import { createApi } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';

export function useApi() {
  const { token } = useAuth();
  return useMemo(() => createApi(token), [token]);
}
