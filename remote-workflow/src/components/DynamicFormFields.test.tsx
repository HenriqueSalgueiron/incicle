import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRef, useCallback, useState } from 'react';
import type { TemplateField } from '@workflow/shared-types';
import type { Resolver } from 'react-hook-form';
import { DynamicFormFields } from './DynamicFormFields';
import { generateZodSchema } from '@/schemas/dynamicFormSchema';

/** Wrapper that provides FormProvider for isolated DynamicFormFields testing */
function FormWrapper({
  fields,
  onSubmit,
}: {
  fields: TemplateField[];
  onSubmit?: (data: Record<string, unknown>) => void;
}) {
  const schema = generateZodSchema(fields);
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {} as Record<string, unknown>,
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit ?? vi.fn())}>
        <DynamicFormFields fields={fields} />
        <button type="submit">Submit</button>
      </form>
    </FormProvider>
  );
}

const MIXED_FIELDS: TemplateField[] = [
  { name: 'titulo', type: 'text', label: 'Titulo', required: true },
  { name: 'descricao', type: 'textarea', label: 'Descricao', required: false },
  { name: 'email', type: 'email', label: 'Email', required: true },
  { name: 'valor', type: 'number', label: 'Valor', required: true },
  { name: 'data', type: 'date', label: 'Data', required: true },
  { name: 'dept', type: 'select', label: 'Departamento', required: true, options: ['Eng', 'RH'] },
];

describe('DynamicFormFields', () => {
  it('renders correct input types for each field, passes axe', async () => {
    const { container } = render(<FormWrapper fields={MIXED_FIELDS} />);

    // text → input[type=text]
    expect(screen.getByLabelText(/titulo/i)).toHaveAttribute('type', 'text');
    // textarea → textarea element
    expect(screen.getByLabelText(/descricao/i).tagName).toBe('TEXTAREA');
    // email → input[type=email]
    expect(screen.getByLabelText(/email/i)).toHaveAttribute('type', 'email');
    // number → input[type=number]
    expect(screen.getByLabelText(/valor/i)).toHaveAttribute('type', 'number');
    // date → input[type=date]
    expect(screen.getByLabelText(/data/i)).toHaveAttribute('type', 'date');
    // select → select element with options
    const select = screen.getByLabelText(/departamento/i);
    expect(select.tagName).toBe('SELECT');
    expect(screen.getByText('Eng')).toBeInTheDocument();
    expect(screen.getByText('RH')).toBeInTheDocument();

    expect(await axe(container)).toHaveNoViolations();
  });

  it('shows asterisk for required fields', () => {
    render(<FormWrapper fields={MIXED_FIELDS} />);

    // Required fields should have * marker
    const requiredLabels = ['Titulo', 'Email', 'Valor', 'Data', 'Departamento'];
    for (const label of requiredLabels) {
      const labelEl = screen.getByText(label).closest('label');
      expect(labelEl?.textContent).toContain('*');
    }

    // Optional field (Descricao) should not have *
    const optionalLabel = screen.getByText('Descricao').closest('label');
    expect(optionalLabel?.textContent).not.toContain('*');
  });

  it('shows validation errors with correct ARIA attributes, passes axe', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <FormWrapper fields={[{ name: 'titulo', type: 'text', label: 'Titulo', required: true }]} />,
    );

    await user.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      const alerts = screen.getAllByRole('alert');
      expect(alerts.length).toBeGreaterThanOrEqual(1);
    });

    const input = screen.getByLabelText(/titulo/i);
    expect(input).toHaveAttribute('aria-invalid', 'true');

    const errorId = input.getAttribute('aria-describedby') ?? '';
    expect(errorId).toBeTruthy();
    expect(document.getElementById(errorId)).toBeInTheDocument();

    expect(await axe(container)).toHaveNoViolations();
  });

  it('preserves common field values when switching templates without remounting', async () => {
    const user = userEvent.setup();

    const templateA: TemplateField[] = [
      { name: 'valor', type: 'number', label: 'Valor', required: true },
      { name: 'departamento', type: 'select', label: 'Departamento', required: true, options: ['Eng', 'RH'] },
      { name: 'justificativa', type: 'textarea', label: 'Justificativa', required: true },
    ];

    const templateB: TemplateField[] = [
      { name: 'valor', type: 'number', label: 'Valor', required: true },
      { name: 'departamento', type: 'select', label: 'Departamento', required: true, options: ['Eng', 'RH'] },
      { name: 'observacao', type: 'textarea', label: 'Observacao', required: false },
    ];

    /**
     * Wrapper that simulates template switching using the same pattern as InstanceCreate:
     * schemaRef + form.reset(preserved) — no key={templateId} remounting.
     */
    function TemplateSwitchWrapper() {
      const [fields, setFields] = useState(templateA);
      const schemaRef = useRef<z.ZodObject<z.ZodRawShape>>(generateZodSchema(templateA));

      const dynamicResolver: Resolver = useCallback(async (values, context, options) => {
        const resolver = zodResolver(schemaRef.current);
        return resolver(values, context, options);
      }, []);

      const form = useForm({
        resolver: dynamicResolver,
        defaultValues: {} as Record<string, unknown>,
      });

      function switchTemplate() {
        const newFields = templateB;
        const newFieldNames = new Set(newFields.map((f) => f.name));
        const currentValues = form.getValues();

        const preserved: Record<string, unknown> = {};
        for (const name of newFieldNames) {
          if (name in currentValues && currentValues[name] !== undefined && currentValues[name] !== '') {
            preserved[name] = currentValues[name];
          }
        }

        schemaRef.current = generateZodSchema(newFields);
        form.reset(preserved);
        setFields(newFields);
      }

      return (
        <FormProvider {...form}>
          <form>
            <DynamicFormFields fields={fields} />
          </form>
          <button type="button" onClick={switchTemplate}>
            Switch Template
          </button>
        </FormProvider>
      );
    }

    const { container } = render(<TemplateSwitchWrapper />);

    // Fill fields in template A
    await user.clear(screen.getByLabelText(/valor/i));
    await user.type(screen.getByLabelText(/valor/i), '500');
    await user.selectOptions(screen.getByLabelText(/departamento/i), 'Eng');

    // Verify justificativa exists in template A
    expect(screen.getByLabelText(/justificativa/i)).toBeInTheDocument();

    // Switch to template B
    await user.click(screen.getByRole('button', { name: /switch template/i }));

    // Common fields preserved
    expect(screen.getByLabelText(/valor/i)).toHaveValue(500);
    expect(screen.getByLabelText(/departamento/i)).toHaveValue('Eng');

    // Template A-only field gone
    expect(screen.queryByLabelText(/justificativa/i)).not.toBeInTheDocument();

    // Template B-only field present and empty
    expect(screen.getByLabelText(/observacao/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/observacao/i)).toHaveValue('');

    expect(await axe(container)).toHaveNoViolations();
  });
});
