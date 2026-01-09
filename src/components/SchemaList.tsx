import type { FormSchema } from '../types';

interface Props {
  schemas: FormSchema[];
  selectedSchemaId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export function SchemaList({
  schemas,
  selectedSchemaId,
  onSelect,
  onDelete,
}: Props) {
  if (schemas.length === 0) {
    return <p className="text-muted">No forms created yet.</p>;
  }

  return (
    <ul className="schema-list">
      {schemas.map((schema) => {
        const isActive = schema.id === selectedSchemaId;
        return (
          <li
            key={schema.id}
            className={`schema-list-item ${isActive ? 'active' : ''}`}
          >
            <button
              type="button"
              className="schema-list-item-button"
              onClick={() => onSelect(schema.id)}
            >
              <span className="schema-list-name">{schema.name || 'Untitled'}</span>
              {schema.description && (
                <span className="schema-list-description">
                  {schema.description}
                </span>
              )}
            </button>
            <button
              type="button"
              className="schema-list-delete"
              onClick={() => onDelete(schema.id)}
              title="Delete schema"
            >
              ✕
            </button>
          </li>
        );
      })}
    </ul>
  );
}
