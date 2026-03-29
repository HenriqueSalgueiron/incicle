import { create } from 'zustand';
import type { User, Company } from '@workflow/shared-types';

interface UnauthenticatedState {
  user: null;
  token: null;
  companies: [];
  currentCompanyId: null;
  isAuthenticated: false;
}

interface AuthenticatedState {
  user: User;
  token: string;
  companies: Company[];
  currentCompanyId: string;
  isAuthenticated: true;
}

type AuthData = UnauthenticatedState | AuthenticatedState;

type AuthActions = {
  login: (user: User, token: string, companies: Company[]) => void;
  logout: () => void;
  switchCompany: (companyId: string) => void;
};

type AuthState = AuthData & AuthActions;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  companies: [],
  currentCompanyId: null,
  isAuthenticated: false,

  login: (user, token, companies) =>
    set({
      user,
      token,
      companies,
      currentCompanyId: companies[0]?.id ?? '',
      isAuthenticated: true,
    }),

  logout: () =>
    set({
      user: null,
      token: null,
      companies: [],
      currentCompanyId: null,
      isAuthenticated: false,
    }),

  switchCompany: (companyId) => {
    const { companies } = get();
    const exists = companies.some((c) => c.id === companyId);
    if (exists) {
      set({ currentCompanyId: companyId });
    }
  },
}));
