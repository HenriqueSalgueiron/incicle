import type { Template, TemplateSummary } from '@workflow/shared-types';

const TEMPLATES: Template[] = [
  {
    id: 'template-1',
    name: 'Compras e Aquisições',
    version: 2,
    fields: [
      { name: 'valor', type: 'number', label: 'Valor (R$)', required: true, validation: { min: 0, message: 'Valor deve ser positivo' } },
      { name: 'departamento', type: 'select', label: 'Departamento', required: true, options: ['Engenharia', 'Marketing', 'Financeiro', 'RH', 'Operações'] },
      { name: 'justificativa', type: 'textarea', label: 'Justificativa', required: true, validation: { min: 10, message: 'Mínimo de 10 caracteres' } },
      { name: 'centro_custo', type: 'text', label: 'Centro de Custo', required: true },
      { name: 'prioridade', type: 'select', label: 'Prioridade', required: false, options: ['Alta', 'Média', 'Baixa', 'Crítica'] },
      { name: 'fornecedor', type: 'text', label: 'Fornecedor', required: true },
    ],
  },
  {
    id: 'template-2',
    name: 'Despesas e Reembolsos',
    version: 3,
    fields: [
      { name: 'valor', type: 'number', label: 'Valor (R$)', required: true, validation: { min: 0, message: 'Valor deve ser positivo' } },
      { name: 'departamento', type: 'select', label: 'Departamento', required: true, options: ['Engenharia', 'Marketing', 'Financeiro', 'RH', 'Operações'] },
      { name: 'justificativa', type: 'textarea', label: 'Justificativa', required: true, validation: { min: 10, message: 'Mínimo de 10 caracteres' } },
      { name: 'centro_custo', type: 'text', label: 'Centro de Custo', required: true },
      { name: 'observacao', type: 'textarea', label: 'Observação', required: false },
      { name: 'num_parcelas', type: 'number', label: 'Número de Parcelas', required: false, validation: { min: 1, max: 48, message: 'Entre 1 e 48 parcelas' } },
    ],
  },
  {
    id: 'template-3',
    name: 'Contratos Jurídicos',
    version: 1,
    fields: [
      { name: 'valor', type: 'number', label: 'Valor do Contrato (R$)', required: true, validation: { min: 0, message: 'Valor deve ser positivo' } },
      { name: 'departamento', type: 'select', label: 'Departamento Responsável', required: true, options: ['Engenharia', 'Marketing', 'Financeiro', 'RH', 'Operações'] },
      { name: 'justificativa', type: 'textarea', label: 'Justificativa', required: true, validation: { min: 10, message: 'Mínimo de 10 caracteres' } },
      { name: 'data_inicio', type: 'date', label: 'Data de Início do Contrato', required: true },
      { name: 'observacao', type: 'textarea', label: 'Observações Jurídicas', required: false },
      { name: 'email_contato', type: 'email', label: 'Email do Contato', required: true },
    ],
  },
  {
    id: 'template-4',
    name: 'Gestão de Pessoas',
    version: 2,
    fields: [
      { name: 'departamento', type: 'select', label: 'Departamento', required: true, options: ['Engenharia', 'Marketing', 'Financeiro', 'RH', 'Operações'] },
      { name: 'justificativa', type: 'textarea', label: 'Justificativa', required: true, validation: { min: 10, message: 'Mínimo de 10 caracteres' } },
      { name: 'data_inicio', type: 'date', label: 'Data de Início', required: true },
      { name: 'prioridade', type: 'select', label: 'Prioridade', required: false, options: ['Alta', 'Média', 'Baixa', 'Crítica'] },
      { name: 'email_contato', type: 'email', label: 'Email do Colaborador', required: true },
      { name: 'cargo', type: 'text', label: 'Cargo', required: true },
    ],
  },
  {
    id: 'template-5',
    name: 'Projetos e Investimentos',
    version: 1,
    fields: [
      { name: 'valor', type: 'number', label: 'Investimento Estimado (R$)', required: true, validation: { min: 0, message: 'Valor deve ser positivo' } },
      { name: 'departamento', type: 'select', label: 'Departamento Responsável', required: true, options: ['Engenharia', 'Marketing', 'Financeiro', 'RH', 'Operações'] },
      { name: 'justificativa', type: 'textarea', label: 'Justificativa do Projeto', required: true, validation: { min: 10, message: 'Mínimo de 10 caracteres' } },
      { name: 'centro_custo', type: 'text', label: 'Centro de Custo', required: true },
      { name: 'data_inicio', type: 'date', label: 'Data Prevista de Início', required: false },
      { name: 'prioridade', type: 'select', label: 'Prioridade', required: false, options: ['Alta', 'Média', 'Baixa', 'Crítica'] },
      { name: 'roi_estimado', type: 'number', label: 'ROI Estimado (%)', required: false, validation: { min: 0, max: 1000, message: 'Entre 0% e 1000%' } },
    ],
  },
];

export function getTemplateList(): TemplateSummary[] {
  return TEMPLATES.map(({ id, name, version }) => ({ id, name, version }));
}

export function getTemplateSchema(id: string): Template | null {
  return TEMPLATES.find((t) => t.id === id) ?? null;
}
