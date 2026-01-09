import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEventHandler } from 'react';

import type { FormSchema, ValidationErrorMap } from '../types';

interface Props {
  schema: FormSchema;
  onSubmit: (data: Record<string, unknown>) => void;
}

type FormValues = Record<string, string>;

export function DynamicForm({ schema, onSubmit }: Props) {
  const [values, setValues] = useState<FormValues>({});
  const [errors, setErrors] = useState<ValidationErrorMap>({});

  useEffect(() => {
    const initial: FormValues = {};
    schema.fields.forEach((f) => {
      initial[f.id] = '';
    });
    setValues(initial);
    setErrors({});
  }, [schema]);

  const updateValue = (fieldId: string, value: string) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const validate = (): boolean => {
    const newErrors: ValidationErrorMap = {};

    for (const field of schema.fields) {
      const rawValue = values[field.id] ?? '';
      const trimmed = rawValue.trim();

      if (field.required && trimmed === '') {
        newErrors[field.id] = 'This field is required';
        continue;
      }

      if (trimmed === '') continue;

      if (field.type === 'number') {
        const num = Number(trimmed);
        if (Number.isNaN(num)) {
          newErrors[field.id] = 'Must be a valid number';
          continue;
        }
        if (typeof field.min === 'number' && num < field.min) {
          newErrors[field.id] = `Must be ≥ ${field.min}`;
          continue;
        }
        if (typeof field.max === 'number' && num > field.max) {
          newErrors[field.id] = `Must be ≤ ${field.max}`;
          continue;
        }
      }

      if (field.type === 'text' && field.pattern) {
        try {
          const regex = new RegExp(field.pattern);
          if (!regex.test(trimmed)) {
            newErrors[field.id] = 'Value does not match required format';
          }
        } catch {
          // invalid regex; skip
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit: FormEventHandler = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const data: Record<string, unknown> = {};
    schema.fields.forEach((field) => {
      const raw = values[field.id] ?? '';
      let parsed: unknown = raw;

      if (field.type === 'number' && raw.trim() !== '') {
        parsed = Number(raw);
      }

      data[field.name] = parsed;
    });

    onSubmit(data);

    const reset: FormValues = {};
    schema.fields.forEach((f) => (reset[f.id] = ''));
    setValues(reset);
    setErrors({});
  };

  if (schema.fields.length === 0) {
    return (
      <div className="card">
        <h3>Form</h3>
        <p className="text-muted">
          This form has no fields yet. Add fields in the &quot;Schema
          Designer&quot; tab.
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3>Form</h3>
      <p className="text-muted">
        Fill out the generated form below. Validation is based on the schema.
      </p>

      <form onSubmit={handleSubmit} className={`dfb-form dfb-form-${schema.layout}`}>
        {schema.fields.map((field) => {
          const error = errors[field.id];
          const value = values[field.id] ?? '';

          const commonProps = {
            id: field.id,
            name: field.id,
            value,
            onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
              updateValue(field.id, e.target.value),
            placeholder: field.placeholder ?? '',
          };

          return (
            <div
              key={field.id}
              className={`form-field ${error ? 'has-error' : ''}`}
            >
              <label htmlFor={field.id}>
                {field.label}
                {field.required && <span className="required">*</span>}
              </label>

              {field.type === 'text' && (
                <input type="text" {...commonProps} />
              )}

              {field.type === 'number' && (
                <input type="number" {...commonProps} />
              )}

              {field.type === 'date' && (
                <input type="date" {...commonProps} />
              )}

              {field.type === 'select' && (
                <select
                  {...commonProps}
                  onChange={(e) => updateValue(field.id, e.target.value)}
                >
                  <option value="">Select...</option>
                  {(field.options ?? []).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              )}

              {error && <div className="error-text">{error}</div>}
            </div>
          );
        })}

        <div className="form-actions">
          <button type="submit" className="btn primary">
            Submit
          </button>
        </div>
      </form>
    </div>
  );
}
