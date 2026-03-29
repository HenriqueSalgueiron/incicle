import { useFormContext } from 'react-hook-form';
import type { TemplateField } from '@workflow/shared-types';

interface DynamicFormFieldsProps {
  fields: TemplateField[];
}

const FIELD_STYLE: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
  marginBottom: '1rem',
};

const LABEL_STYLE: React.CSSProperties = {
  fontSize: '0.8125rem',
  fontWeight: 500,
  color: '#374151',
};

const INPUT_STYLE: React.CSSProperties = {
  padding: '0.5rem 0.75rem',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '0.875rem',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};

const INPUT_ERROR_STYLE: React.CSSProperties = {
  ...INPUT_STYLE,
  borderColor: '#ef4444',
};

const ERROR_STYLE: React.CSSProperties = {
  fontSize: '0.75rem',
  color: '#dc2626',
};

export function DynamicFormFields({ fields }: DynamicFormFieldsProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <>
      {fields.map((field) => {
        const error = errors[field.name];
        const hasError = Boolean(error);
        const errorId = `${field.name}-error`;
        const currentInputStyle = hasError ? INPUT_ERROR_STYLE : INPUT_STYLE;

        return (
          <div key={field.name} style={FIELD_STYLE}>
            <label htmlFor={field.name} style={LABEL_STYLE}>
              {field.label}
              {field.required && <span style={{ color: '#dc2626', marginLeft: '0.25rem' }}>*</span>}
            </label>

            {field.type === 'textarea' ? (
              <textarea
                id={field.name}
                {...register(field.name)}
                rows={3}
                aria-required={field.required}
                aria-invalid={hasError}
                aria-describedby={hasError ? errorId : undefined}
                style={{ ...currentInputStyle, resize: 'vertical' }}
              />
            ) : field.type === 'select' ? (
              <select
                id={field.name}
                {...register(field.name)}
                aria-required={field.required}
                aria-invalid={hasError}
                aria-describedby={hasError ? errorId : undefined}
                style={currentInputStyle}
              >
                <option value="" disabled>
                  Selecione...
                </option>
                {field.options?.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={field.name}
                type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : field.type === 'date' ? 'date' : 'text'}
                {...register(field.name)}
                aria-required={field.required}
                aria-invalid={hasError}
                aria-describedby={hasError ? errorId : undefined}
                style={currentInputStyle}
              />
            )}

            {hasError && (
              <span id={errorId} role="alert" style={ERROR_STYLE}>
                {(error?.message as string) ?? 'Campo inválido'}
              </span>
            )}
          </div>
        );
      })}
    </>
  );
}
