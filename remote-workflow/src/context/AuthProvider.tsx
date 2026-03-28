import type { ReactNode } from 'react';
import type { RemoteAppProps } from '@workflow/shared-types';
import { AuthContext } from '@/context/authContext';

export function AuthProvider({
  children,
  ...authProps
}: RemoteAppProps & { children: ReactNode }) {
  return <AuthContext.Provider value={authProps}>{children}</AuthContext.Provider>;
}
