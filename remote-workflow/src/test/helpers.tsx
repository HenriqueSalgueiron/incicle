import { render, type RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactElement } from 'react';
import type { ApprovalItem } from '@workflow/shared-types';
import type { Api } from '@/services/api';

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
