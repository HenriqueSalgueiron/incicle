import { http, HttpResponse, delay } from 'msw';
import { MOCK_USER, MOCK_TOKEN, MOCK_COMPANIES } from './fixtures/auth';
import { getInboxItems, decideItem } from './fixtures/inbox';
import { getInstance } from './fixtures/instance';
import { getTemplateList, getTemplateSchema } from './fixtures/templates';

export const handlers = [
  http.post('/api/auth/login', () => {
    return HttpResponse.json({
      user: MOCK_USER,
      token: MOCK_TOKEN,
      companies: MOCK_COMPANIES,
    });
  }),

  http.get('/api/approvals/inbox', async ({ request }) => {
    await delay(500); // Simula latência de rede
    const url = new URL(request.url);
    const companyId = url.searchParams.get('company_id') ?? 'company-1';
    const items = getInboxItems(companyId);
    return HttpResponse.json({ items });
  }),

  http.post('/api/approvals/:id/approve', async ({ params }) => {
    await delay(500); // Simula latência de rede
    const { id } = params;
    const result = decideItem(id as string, 'approved');

    if (result.conflict) {
      return HttpResponse.json({ error: 'ALREADY_DECIDED' }, { status: 409 });
    }

    if (!result.success) {
      return HttpResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return HttpResponse.json({ success: true });
  }),

  http.post('/api/approvals/:id/reject', async ({ params }) => {
    await delay(500); // Simula latência de rede
    const { id } = params;
    const result = decideItem(id as string, 'rejected');

    if (result.conflict) {
      return HttpResponse.json({ error: 'ALREADY_DECIDED' }, { status: 409 });
    }

    if (!result.success) {
      return HttpResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return HttpResponse.json({ success: true });
  }),

  http.get('/api/instances/:id', async ({ params }) => {
    await delay(500);
    const instance = getInstance(params.id as string);
    if (!instance) {
      return HttpResponse.json({ error: 'Instance not found' }, { status: 404 });
    }
    return HttpResponse.json(instance);
  }),

  http.get('/api/templates', async () => {
    await delay(300);
    const templates = getTemplateList();
    return HttpResponse.json({ templates });
  }),

  http.get('/api/templates/:id/schema', async ({ params }) => {
    await delay(200);
    const template = getTemplateSchema(params.id as string);
    if (!template) {
      return HttpResponse.json({ error: 'Template not found' }, { status: 404 });
    }
    return HttpResponse.json(template);
  }),

  http.post('/api/instances', async ({ request }) => {
    await delay(800);
    const body = (await request.json()) as Record<string, unknown>;
    const id = `instance-new-${Date.now()}`;
    return HttpResponse.json({ id, status: 'pending', templateId: body.templateId }, { status: 201 });
  }),
];
