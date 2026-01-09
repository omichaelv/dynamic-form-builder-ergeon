import type { ChangeEventHandler } from 'react';
import type { FormSchema, FieldSchema, FieldType } from '../types';

interface Props {
  schema: FormSchema;
  onChange: (schema: FormSchema) => void;
}

const generateId = () =>
  Date.now().toString(36) + Math.random().toString(36).substring(2);

export function SchemaEditor({ schema, onChange }: Props) {
  const updateSchema = (patch: Partial<FormSchema>) => {
    onChange({
      ...schema,
      ...patch,
      updatedAt: new Date().toISOString(),
    });
  };

  const updateField = (fieldId: string, patch: Partial<FieldSchema>) => {
    const updatedFields = schema.fields.map((f) =>
      f.id === fieldId ? { ...f, ...patch } : f
    );
    updateSchema({ fields: updatedFields });
  };

  const addField = () => {
    const index = schema.fields.length + 1;
    const newField: FieldSchema = {
      id: generateId(),
      name: `field_${index}`,
      label: `Field ${index}`,
      type: 'text',
      required: false,
      placeholder: '',
    };
    updateSchema({ fields: [...schema.fields, newField] });
  };

  const removeField = (fieldId: string) => {
    updateSchema({ fields: schema.fields.filter((f) => f.id !== fieldId) });
  };

  const handleLayoutChange: ChangeEventHandler<HTMLSelectElement> = (e) => {
    updateSchema({ layout: e.target.value as any });
  };

  return (
    <div className="card">
      <h3>Schema Designer</h3>
      <p className="text-muted">
        Configure the fields and layout for this form. Changes are applied
        immediately.
      </p>

      <div className="schema-meta">
        <div className="form-row">
          <label>
            Form name
            <input
              type="text"
              value={schema.name}
              onChange={(e) => updateSchema({ name: e.target.value })}
              placeholder="Customer Feedback Form"
            />
          </label>
        </div>

        <div className="form-row">
          <label>
            Description
            <textarea
              value={schema.description ?? ''}
              onChange={(e) => updateSchema({ description: e.target.value })}
              placeholder="Short description of this form"
              rows={2}
            />
          </label>
        </div>

        <div className="form-row">
          <label>
            Layout
            <select value={schema.layout} onChange={handleLayoutChange}>
              <option value="single-column">Single column</option>
              <option value="two-column">Two column</option>
            </select>
          </label>
        </div>
      </div>

      <hr />

      <div className="schema-fields-header">
        <h4>Fields</h4>
        <button type="button" className="btn primary" onClick={addField}>
          + Add Field
        </button>
      </div>

      {schema.fields.length === 0 && (
        <p className="text-muted">
          No fields yet. Click &quot;Add Field&quot; to get started.
        </p>
      )}

      <div className="schema-fields-list">
        {schema.fields.map((field, idx) => (
          <FieldEditorRow
            key={field.id}
            field={field}
            index={idx}
            onChange={(patch) => updateField(field.id, patch)}
            onRemove={() => removeField(field.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface FieldEditorRowProps {
  field: FieldSchema;
  index: number;
  onChange: (patch: Partial<FieldSchema>) => void;
  onRemove: () => void;
}

function FieldEditorRow({ field, index, onChange, onRemove }: FieldEditorRowProps) {
  const handleTypeChange: ChangeEventHandler<HTMLSelectElement> = (e) => {
    const newType = e.target.value as FieldType;
    const patch: Partial<FieldSchema> = { type: newType };
    if (newType !== 'select') {
      patch.options = undefined;
    }
    onChange(patch);
  };

  const optionsText = (field.options ?? []).join(', ');

  return (
    <div className="field-editor-row">
      <div className="field-editor-header">
        <span className="field-index">#{index + 1}</span>
        <button
          type="button"
          className="btn ghost small"
          onClick={onRemove}
          title="Remove field"
        >
          Remove
        </button>
      </div>

      <div className="field-editor-grid">
        <label>
          Label
          <input
            type="text"
            value={field.label}
            onChange={(e) => onChange({ label: e.target.value })}
          />
        </label>

        <label>
          Name (key)
          <input
            type="text"
            value={field.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="internal_field_key"
          />
        </label>

        <label>
          Type
          <select value={field.type} onChange={handleTypeChange}>
            <option value="text">Text</option>
            <option value="number">Number</option>
            <option value="date">Date</option>
            <option value="select">Select</option>
          </select>
        </label>

        <label className="checkbox-inline">
          <input
            type="checkbox"
            checked={!!field.required}
            onChange={(e) => onChange({ required: e.target.checked })}
          />
          Required
        </label>
      </div>

      <div className="field-editor-grid">
        <label>
          Placeholder
          <input
            type="text"
            value={field.placeholder ?? ''}
            onChange={(e) => onChange({ placeholder: e.target.value })}
          />
        </label>

        {field.type === 'number' && (
          <>
            <label>
              Min
              <input
                type="number"
                value={field.min ?? ''}
                onChange={(e) =>
                  onChange({
                    min: e.target.value === '' ? undefined : Number(e.target.value),
                  })
                }
              />
            </label>
            <label>
              Max
              <input
                type="number"
                value={field.max ?? ''}
                onChange={(e) =>
                  onChange({
                    max: e.target.value === '' ? undefined : Number(e.target.value),
                  })
                }
              />
            </label>
          </>
        )}

        {field.type === 'text' && (
          <label>
            Regex pattern
            <input
              type="text"
              value={field.pattern ?? ''}
              onChange={(e) =>
                onChange({ pattern: e.target.value || undefined })
              }
              placeholder="e.g. ^[A-Za-z0-9]+$"
            />
          </label>
        )}

        {field.type === 'select' && (
          <label className="full-width">
            Options (comma separated)
            <input
              type="text"
              value={optionsText}
              onChange={(e) =>
                onChange({
                  options: e.target.value
                    .split(',')
                    .map((o) => o.trim())
                    .filter(Boolean),
                })
              }
              placeholder="Option 1, Option 2, Option 3"
            />
          </label>
        )}
      </div>
    </div>
  );
}
