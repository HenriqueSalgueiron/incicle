import { render, type RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactElement } from 'react';
import type { ApprovalItem, RemoteAppProps } from '@workflow/shared-types';
import type { Api } from '@/services/api';
import { AuthContext } from '@/context/authContext';

// --- Router wrapper ---

export function renderWithRouter(
  ui: ReactElement,
  { initialEntries = ['/'], ...options }: RenderOptions & { initialEntries?: string[] } = {},
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
    ),
    ...options,
  });
}

// --- Auth wrapper ---

const DEFAULT_AUTH: RemoteAppProps = {
  user: { id: 'user-1', name: 'Ana Silva', email: 'ana@test.com' },
  token: 'mock-token',
  currentCompanyId: 'company-1',
  companies: [{ id: 'company-1', name: 'InCicle' }],
  onCompanyChange: () => {},
};

export function renderWithAuth(
  ui: ReactElement,
  {
    authOverrides,
    initialEntries = ['/'],
    ...options
  }: RenderOptions & { authOverrides?: Partial<RemoteAppProps>; initialEntries?: string[] } = {},
) {
  const authProps = { ...DEFAULT_AUTH, ...authOverrides };
  return render(ui, {
    wrapper: ({ children }) => (
      <AuthContext.Provider value={authProps}>
        <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
      </AuthContext.Provider>
    ),
    ...options,
  });
}

// --- Mock API ---

export function createMockApi() {
  return {
    get: vi.fn(),
    post: vi.fn(),
    del: vi.fn(),
  } as unknown as Api & {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    del: ReturnType<typeof vi.fn>;
  };
}

// --- Approval item factory ---

export function createMockApprovalItem(overrides?: Partial<ApprovalItem>): ApprovalItem {
  return {
    id: 'item-1',
    instanceId: 'instance-1',
    title: 'Solicitacao de Compra #42',
    currentStep: 'Aprovacao Gerencial',
    requester: { id: 'user-2', name: 'Bruno Mendes' },
    slaDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    status: 'pending',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

// --- Flush promises ---

export function flushPromises(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
