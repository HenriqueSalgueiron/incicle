import { createContext } from 'react';
import type { RemoteAppProps } from '@workflow/shared-types';

export const AuthContext = createContext<RemoteAppProps | null>(null);
