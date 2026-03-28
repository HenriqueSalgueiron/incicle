import type { User, Company } from './auth';

export const MOCK_USER: User = {
  id: 'user-1',
  name: 'Ana Silva',
  email: 'ana.silva@incicle.com',
};

export const MOCK_TOKEN = 'mock-jwt-token-xyz';

export const MOCK_COMPANIES: Company[] = [
  { id: 'company-1', name: 'InCicle Tecnologia' },
  { id: 'company-2', name: 'Acme Corp' },
  { id: 'company-3', name: 'Globex Industries' },
];
