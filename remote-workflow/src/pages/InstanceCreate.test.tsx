/**
 * Integration test: InstanceCreate page
 *
 * Proves the full create-instance flow works end-to-end within the remote:
 * template selection → dynamic fields render → form submission → success feedback.
 * Also proves template switching preserves common field values (key desafio requirement).
 *
 * Uses MSW/node to intercept real fetch calls — higher confidence than unit mocks.
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { MemoryRouter } from 'react-router-dom';
import type { Template, TemplateSummary } from '@workflow/shared-types';
import { AuthContext } from '@/context/authContext';
import InstanceCreate from './InstanceCreate';

// --- Mock data (subset of shell fixtures) ---

const TEMPLATE_1: Template = {
  id: 'template-1',
  name: 'Compras e Aquisições',
  version: 2,
  fields: [
    { name: 'valor', type: 'number', label: 'Valor (R$)', required: true, validation: { min: 0, message: 'Valor deve ser positivo' } },
    { name: 'departamento', type: 'select', label: 'Departamento', required: true, options: ['Engenharia', 'Marketing', 'Financeiro', 'RH'] },
    { name: 'justificativa', type: 'textarea', label: 'Justificativa', required: true, validation: { min: 10, message: 'Mínimo de 10 caracteres' } },
    { name: 'fornecedor', type: 'text', label: 'Fornecedor', required: true },
  ],
};

const TEMPLATE_2: Template = {
  id: 'template-2',
  name: 'Despesas e Reembolsos',
  version: 3,
  fields: [
    { name: 'valor', type: 'number', label: 'Valor (R$)', required: true, validation: { min: 0, message: 'Valor deve ser positivo' } },
    { name: 'departamento', type: 'select', label: 'Departamento', required: true, options: ['Engenharia', 'Marketing', 'Financeiro', 'RH'] },
    { name: 'justificativa', type: 'textarea', label: 'Justificativa', required: true, validation: { min: 10, message: 'Mínimo de 10 caracteres' } },
    { name: 'observacao', type: 'textarea', label: 'Observação', required: false },
  ],
};

const TEMPLATE_LIST: TemplateSummary[] = [
  { id: 'template-1', name: 'Compras e Aquisições', version: 2 },
  { id: 'template-2', name: 'Despesas e Reembolsos', version: 3 },
];

const TEMPLATES_MAP: Record<string, Template> = {
  'template-1': TEMPLATE_1,
  'template-2': TEMPLATE_2,
};

// --- MSW server ---

const server = setupServer(
  http.get('/api/templates', () => {
    return HttpResponse.json({ templates: TEMPLATE_LIST });
  }),

  http.get('/api/templates/:id/schema', ({ params }) => {
    const template = TEMPLATES_MAP[params.id as string];
    if (!template) return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    return HttpResponse.json(template);
  }),

  http.post('/api/instances', () => {
    return HttpResponse.json(
      { id: 'instance-new-1', status: 'pending', templateId: 'template-1' },
      { status: 201 },
    );
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// --- Auth wrapper ---

const AUTH_PROPS = {
  user: { id: 'user-1', name: 'Ana Silva', email: 'ana@test.com' },
  token: 'mock-token',
  currentCompanyId: 'company-1',
  companies: [{ id: 'company-1', name: 'InCicle' }],
  onCompanyChange: () => {},
};

function renderPage() {
  return render(
    <AuthContext.Provider value={AUTH_PROPS}>
      <MemoryRouter initialEntries={['/instances/new']}>
        <InstanceCreate />
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe('InstanceCreate integration', () => {
  it('full flow: select template, fill form, submit, see success', async () => {
    const user = userEvent.setup();
    renderPage();

    // Wait for templates to load
    await waitFor(() => {
      expect(screen.getByLabelText('Template')).toBeInTheDocument();
    });

    // Select template
    await user.selectOptions(screen.getByLabelText('Template'), 'template-1');

    // Wait for schema fields to load
    await waitFor(() => {
      expect(screen.getByLabelText(/valor/i)).toBeInTheDocument();
    });

    // Fill required fields
    await user.type(screen.getByLabelText(/valor/i), '1000');
    await user.selectOptions(screen.getByLabelText(/departamento/i), 'Engenharia');
    await user.type(screen.getByLabelText(/justificativa/i), 'Compra urgente de material para projeto');
    await user.type(screen.getByLabelText(/fornecedor/i), 'Fornecedor ABC');

    // Submit
    await user.click(screen.getByRole('button', { name: /criar instância/i }));

    // Wait for success state
    await waitFor(() => {
      expect(screen.getByText(/instância criada com sucesso/i)).toBeInTheDocument();
    });
  });

  it('switching template preserves common field values', async () => {
    const user = userEvent.setup();
    renderPage();

    // Wait for templates to load
    await waitFor(() => {
      expect(screen.getByLabelText('Template')).toBeInTheDocument();
    });

    // Select template-1
    await user.selectOptions(screen.getByLabelText('Template'), 'template-1');
    await waitFor(() => {
      expect(screen.getByLabelText(/valor/i)).toBeInTheDocument();
    });

    // Fill shared fields (valor, departamento exist in both templates)
    await user.type(screen.getByLabelText(/valor/i), '500');
    await user.selectOptions(screen.getByLabelText(/departamento/i), 'Marketing');

    // Verify template-1 specific field exists
    expect(screen.getByLabelText(/fornecedor/i)).toBeInTheDocument();

    // Switch to template-2
    await user.selectOptions(screen.getByLabelText('Template'), 'template-2');
    await waitFor(() => {
      expect(screen.getByLabelText(/observação/i)).toBeInTheDocument();
    });

    // Common fields preserved
    expect(screen.getByLabelText(/valor/i)).toHaveValue(500);
    expect(screen.getByLabelText(/departamento/i)).toHaveValue('Marketing');

    // Template-1 exclusive field gone
    expect(screen.queryByLabelText(/fornecedor/i)).not.toBeInTheDocument();

    // Template-2 exclusive field empty
    expect(screen.getByLabelText(/observação/i)).toHaveValue('');
  });
});
