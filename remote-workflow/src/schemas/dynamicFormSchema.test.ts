import { describe, it, expect } from 'vitest';
import type { TemplateField } from '@workflow/shared-types';
import { generateZodSchema } from './dynamicFormSchema';

function field(overrides: Partial<TemplateField> & { name: string; type: TemplateField['type'] }): TemplateField {
  return { label: overrides.name, required: true, ...overrides };
}

describe('generateZodSchema', () => {
  describe('text fields', () => {
    it('rejects empty string when required', () => {
      const schema = generateZodSchema([field({ name: 'title', type: 'text' })]);
      const result = schema.safeParse({ title: '' });
      expect(result.success).toBe(false);
    });

    it('accepts non-empty string when required', () => {
      const schema = generateZodSchema([field({ name: 'title', type: 'text' })]);
      const result = schema.safeParse({ title: 'hello' });
      expect(result.success).toBe(true);
    });

    it('accepts empty string when optional (preprocess converts to undefined)', () => {
      const schema = generateZodSchema([
        field({ name: 'title', type: 'text', required: false }),
      ]);
      const result = schema.safeParse({ title: '' });
      expect(result.success).toBe(true);
    });

    it('validates min/max length', () => {
      const schema = generateZodSchema([
        field({
          name: 'code',
          type: 'text',
          validation: { min: 3, max: 10, message: 'Between 3-10' },
        }),
      ]);

      expect(schema.safeParse({ code: 'ab' }).success).toBe(false);
      expect(schema.safeParse({ code: 'abcde' }).success).toBe(true);
      expect(schema.safeParse({ code: 'a'.repeat(11) }).success).toBe(false);
    });

    it('validates regex pattern', () => {
      const schema = generateZodSchema([
        field({
          name: 'code',
          type: 'text',
          validation: { pattern: '^[A-Z]+$', message: 'Uppercase only' },
        }),
      ]);

      expect(schema.safeParse({ code: 'abc' }).success).toBe(false);
      expect(schema.safeParse({ code: 'ABC' }).success).toBe(true);
    });
  });

  describe('email fields', () => {
    it('rejects invalid email', () => {
      const schema = generateZodSchema([field({ name: 'email', type: 'email' })]);
      const result = schema.safeParse({ email: 'not-an-email' });
      expect(result.success).toBe(false);
    });

    it('accepts valid email', () => {
      const schema = generateZodSchema([field({ name: 'email', type: 'email' })]);
      const result = schema.safeParse({ email: 'user@example.com' });
      expect(result.success).toBe(true);
    });
  });

  describe('number fields', () => {
    it('validates min/max', () => {
      const schema = generateZodSchema([
        field({
          name: 'valor',
          type: 'number',
          validation: { min: 0, max: 100, message: 'Between 0-100' },
        }),
      ]);

      expect(schema.safeParse({ valor: -1 }).success).toBe(false);
      expect(schema.safeParse({ valor: 50 }).success).toBe(true);
      expect(schema.safeParse({ valor: 101 }).success).toBe(false);
    });

    it('coerces string to number', () => {
      const schema = generateZodSchema([field({ name: 'valor', type: 'number' })]);
      const result = schema.safeParse({ valor: '42' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.valor).toBe(42);
      }
    });
  });

  describe('date fields', () => {
    it('rejects empty string when required', () => {
      const schema = generateZodSchema([field({ name: 'data', type: 'date' })]);
      const result = schema.safeParse({ data: '' });
      expect(result.success).toBe(false);
    });

    it('accepts valid date string', () => {
      const schema = generateZodSchema([field({ name: 'data', type: 'date' })]);
      const result = schema.safeParse({ data: '2026-03-30' });
      expect(result.success).toBe(true);
    });
  });

  describe('select fields', () => {
    it('rejects value not in options', () => {
      const schema = generateZodSchema([
        field({ name: 'dept', type: 'select', options: ['A', 'B', 'C'] }),
      ]);
      const result = schema.safeParse({ dept: 'D' });
      expect(result.success).toBe(false);
    });

    it('accepts value in options', () => {
      const schema = generateZodSchema([
        field({ name: 'dept', type: 'select', options: ['A', 'B', 'C'] }),
      ]);
      const result = schema.safeParse({ dept: 'A' });
      expect(result.success).toBe(true);
    });
  });

  describe('multiple fields together', () => {
    it('validates a complete object with mixed field types', () => {
      const schema = generateZodSchema([
        field({ name: 'titulo', type: 'text' }),
        field({ name: 'valor', type: 'number', validation: { min: 0 } }),
        field({ name: 'dept', type: 'select', options: ['Eng', 'RH'] }),
      ]);

      expect(
        schema.safeParse({ titulo: 'Compra', valor: 100, dept: 'Eng' }).success,
      ).toBe(true);

      expect(
        schema.safeParse({ titulo: '', valor: -1, dept: 'Marketing' }).success,
      ).toBe(false);
    });
  });
});
