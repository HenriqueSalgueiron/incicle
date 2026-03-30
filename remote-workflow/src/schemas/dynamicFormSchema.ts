import { z } from 'zod';
import type { TemplateField } from '@workflow/shared-types';

export function generateZodSchema(fields: TemplateField[]): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of fields) {
    let schema: z.ZodTypeAny;

    switch (field.type) {
      case 'text':
      case 'textarea': {
        let str = z.string();
        if (field.required && field.validation?.min == null) {
          str = str.min(1, 'Campo obrigatório');
        }
        if (field.validation?.min != null) str = str.min(field.validation.min, field.validation.message);
        if (field.validation?.max != null) str = str.max(field.validation.max, field.validation.message);
        if (field.validation?.pattern) str = str.regex(new RegExp(field.validation.pattern), field.validation.message);
        schema = str;
        break;
      }

      case 'email':
        schema = z.string().email(field.validation?.message ?? 'Email inválido');
        break;

      case 'number': {
        let num = z.coerce.number({ error: 'Informe um número válido' });
        if (field.validation?.min != null) num = num.min(field.validation.min, field.validation.message);
        if (field.validation?.max != null) num = num.max(field.validation.max, field.validation.message);
        schema = num;
        break;
      }

      case 'date':
        schema = z.string().min(1, 'Selecione uma data');
        break;

      case 'select':
        if (field.options && field.options.length > 0) {
          schema = z.enum(field.options as [string, ...string[]], {
            error: 'Selecione uma opção',
          });
        } else {
          schema = z.string();
        }
        break;

      default:
        schema = z.string();
    }

    if (!field.required) {
      schema = z.preprocess(
        (val) => (val === '' || val === undefined ? undefined : val),
        schema.optional(),
      );
    }

    shape[field.name] = schema;
  }

  return z.object(shape);
}
