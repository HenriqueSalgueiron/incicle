export interface TemplateField {
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'email';
  label: string;
  required: boolean;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

export interface Template {
  id: string;
  name: string;
  version: number;
  fields: TemplateField[];
}

export interface TemplateSummary {
  id: string;
  name: string;
  version: number;
}
