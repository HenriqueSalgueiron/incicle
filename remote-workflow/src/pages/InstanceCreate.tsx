import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Resolver } from 'react-hook-form';
import type { Template, TemplateSummary } from '@workflow/shared-types';
import { useApi } from '@/hooks/useApi';
import { generateZodSchema } from '@/schemas/dynamicFormSchema';
import { DynamicFormFields } from '@/components/DynamicFormFields';

type PageState = 'loading_templates' | 'ready' | 'submitting' | 'submitted' | 'error';

export default function InstanceCreate() {
  const api = useApi();

  const [pageState, setPageState] = useState<PageState>('loading_templates');
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [loadingSchema, setLoadingSchema] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const schemaRef = useRef<z.ZodObject<z.ZodRawShape>>(z.object({}));
  const abortRef = useRef<AbortController | null>(null);

  const dynamicResolver: Resolver = useCallback(async (values, context, options) => {
    const resolver = zodResolver(schemaRef.current);
    return resolver(values, context, options);
  }, []);

  const form = useForm({
    resolver: dynamicResolver,
    defaultValues: {} as Record<string, unknown>,
  });

  // Fetch template list on mount
  useEffect(() => {
    api
      .get<{ templates: TemplateSummary[] }>('/api/templates?status=published')
      .then((data) => {
        setTemplates(data.templates);
        setPageState('ready');
      })
      .catch(() => {
        setErrorMessage('Erro ao carregar templates.');
        setPageState('error');
      });
  }, [api]);

  function handleTemplateChange(templateId: string) {
    if (!templateId) return;

    // Abort previous schema fetch if in flight
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoadingSchema(true);

    api
      .get<Template>(`/api/templates/${templateId}/schema`)
      .then((template) => {
        if (controller.signal.aborted) return;

        const newFieldNames = new Set(template.fields.map((f) => f.name));
        const currentValues = form.getValues();

        // Preserve only values for fields that exist in the new template
        const preserved: Record<string, unknown> = {};
        for (const name of newFieldNames) {
          if (name in currentValues && currentValues[name] !== undefined && currentValues[name] !== '') {
            preserved[name] = currentValues[name];
          }
        }

        // Update schema ref before reset so validation uses the new schema
        schemaRef.current = generateZodSchema(template.fields);
        form.reset(preserved);
        setSelectedTemplate(template);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (controller.signal.aborted) return;
        setErrorMessage('Erro ao carregar schema do template.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingSchema(false);
      });
  }

  async function onSubmit(data: Record<string, unknown>) {
    if (!selectedTemplate) return;

    setPageState('submitting');
    setErrorMessage(null);

    try {
      const response = await api.post<{ id: string }>('/api/instances', {
        templateId: selectedTemplate.id,
        templateVersion: selectedTemplate.version,
        contextData: data,
      });
      setCreatedId(response.id);
      setPageState('submitted');
    } catch {
      setErrorMessage('Erro ao criar instância. Tente novamente.');
      setPageState('ready');
    }
  }

  if (pageState === 'loading_templates') {
    return (
      <div role="status" aria-live="polite" style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
        Carregando templates...
      </div>
    );
  }

  if (pageState === 'error' && !templates.length) {
    return (
      <div style={{ padding: '1rem' }}>
        <div role="alert" style={{ padding: '0.75rem', background: '#fee2e2', borderRadius: '6px', color: '#991b1b', fontSize: '0.875rem', marginBottom: '1rem' }}>
          {errorMessage}
        </div>
        <Link to="/approvals/inbox" style={{ fontSize: '0.875rem', color: '#1d4ed8', textDecoration: 'none' }}>
          ← Voltar para Inbox
        </Link>
      </div>
    );
  }

  if (pageState === 'submitted') {
    return (
      <div role="status" aria-live="polite" style={{ padding: '2rem', textAlign: 'center' }}>
        <div
          style={{
            width: '3rem',
            height: '3rem',
            borderRadius: '50%',
            background: '#dcfce7',
            color: '#166534',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            marginBottom: '1rem',
          }}
        >
          ✓
        </div>
        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.125rem', color: '#166534' }}>Instância criada com sucesso</h3>
        <p style={{ margin: '0 0 1.5rem', fontSize: '0.875rem', color: '#6b7280' }}>Sua solicitação foi submetida para aprovação.</p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          {createdId && (
            <Link
              to={`/instances/${createdId}`}
              style={{
                padding: '0.5rem 1rem',
                background: '#1d4ed8',
                color: '#fff',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: '0.875rem',
              }}
            >
              Ver Instância
            </Link>
          )}
          <button
            onClick={() => {
              form.reset({});
              schemaRef.current = z.object({});
              setSelectedTemplate(null);
              setCreatedId(null);
              setPageState('ready');
            }}
            style={{
              padding: '0.5rem 1rem',
              background: '#f3f4f6',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            Criar outra
          </button>
        </div>
      </div>
    );
  }

  const isSubmitting = pageState === 'submitting';

  return (
    <main style={{ padding: '0.5rem 0' }}>
      <Link
        to="/approvals/inbox"
        style={{ display: 'inline-block', marginBottom: '1rem', fontSize: '0.875rem', color: '#1d4ed8', textDecoration: 'none' }}
      >
        ← Voltar para Inbox
      </Link>

      <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.25rem' }}>Criar Instância</h2>

      {errorMessage && (
        <div role="alert" style={{ padding: '0.75rem', background: '#fee2e2', borderRadius: '6px', color: '#991b1b', fontSize: '0.875rem', marginBottom: '1rem' }}>
          {errorMessage}
        </div>
      )}

      <div style={{ marginBottom: '1.5rem' }}>
        <label htmlFor="template-select" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' }}>
          Template
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <select
            id="template-select"
            value={selectedTemplate?.id ?? ''}
            onChange={(e) => handleTemplateChange(e.target.value)}
            disabled={isSubmitting || loadingSchema}
            style={{
              padding: '0.5rem 0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '0.875rem',
              minWidth: '16rem',
            }}
          >
            <option value="" disabled>
              Selecione um template...
            </option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} (v{t.version})
              </option>
            ))}
          </select>
          {loadingSchema && (
            <span role="status" aria-live="polite" style={{ fontSize: '0.75rem', color: '#6b7280' }}>
              Carregando campos...
            </span>
          )}
        </div>
      </div>

      {selectedTemplate && (
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} style={{ opacity: loadingSchema ? 0.5 : 1, pointerEvents: loadingSchema ? 'none' : 'auto' }}>
            <DynamicFormFields fields={selectedTemplate.fields} />

            <div style={{ marginTop: '1rem' }}>
              <button
                type="submit"
                disabled={isSubmitting || loadingSchema}
                aria-busy={isSubmitting}
                style={{
                  padding: '0.625rem 1.5rem',
                  background: isSubmitting || loadingSchema ? '#93c5fd' : '#1d4ed8',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  cursor: isSubmitting || loadingSchema ? 'not-allowed' : 'pointer',
                  fontWeight: 500,
                }}
              >
                {isSubmitting ? 'Enviando...' : 'Criar Instância'}
              </button>
            </div>
          </form>
        </FormProvider>
      )}
    </main>
  );
}
