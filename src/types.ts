export type FieldType = 'text' | 'number' | 'date' | 'select';

export type FormLayout = 'single-column' | 'two-column';

export interface FieldSchema {
  id: string; // internal id
  name: string; // key in submitted data
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
  pattern?: string; // regex pattern string
  options?: string[]; // for "select"
}

export interface FormSchema {
  id: string;
  name: string;
  description?: string;
  layout: FormLayout;
  fields: FieldSchema[];
  createdAt: string;
  updatedAt: string;
}

export interface FormEntry {
  id: string;
  schemaId: string;
  createdAt: string;
  data: Record<string, unknown>;
}

export type ValidationErrorMap = Record<string, string | undefined>;
