import { create } from 'zustand';
import type { User, Company } from '@workflow/shared-types';

interface AuthState {
  user: User | null;
  token: string | null;
  companies: Company[];
  currentCompanyId: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string, companies: Company[]) => void;
  logout: () => void;
  switchCompany: (companyId: string) => void;
}

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
      currentCompanyId: companies[0]?.id ?? null,
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
