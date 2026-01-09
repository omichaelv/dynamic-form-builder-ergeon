import { useEffect, useMemo, useState } from 'react';
import type { ChangeEventHandler } from 'react';

import { useLocalStorage } from './hooks/useLocalStorage';
import type { FormEntry, FormLayout, FormSchema } from './types';
import { SchemaList } from './components/SchemaList';
import { SchemaEditor } from './components/SchemaEditor';
import { DynamicForm } from './components/DynamicForm';
import { EntriesTable } from './components/EntriesTable';

const SCHEMAS_KEY = 'dfb_schemas';
const ENTRIES_KEY = 'dfb_entries';

const generateId = () =>
  Date.now().toString(36) + Math.random().toString(36).substring(2);

type ActiveTab = 'form' | 'entries' | 'schema';

function App() {
  const [schemas, setSchemas] = useLocalStorage<FormSchema[]>(SCHEMAS_KEY, []);
  const [entries, setEntries] = useLocalStorage<FormEntry[]>(ENTRIES_KEY, []);
  const [selectedSchemaId, setSelectedSchemaId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('form');

  useEffect(() => {
    if (!selectedSchemaId && schemas.length > 0) {
      setSelectedSchemaId(schemas[0].id);
    }
  }, [schemas, selectedSchemaId]);

  const selectedSchema = useMemo(
    () => schemas.find((s) => s.id === selectedSchemaId) ?? null,
    [schemas, selectedSchemaId]
  );

  const schemaEntries = useMemo(
    () =>
      selectedSchema
        ? entries.filter((e) => e.schemaId === selectedSchema.id)
        : [],
    [entries, selectedSchema]
  );

  const handleCreateSchema = () => {
    const now = new Date().toISOString();
    const id = generateId();
    const newSchema: FormSchema = {
      id,
      name: 'Untitled Form',
      description: '',
      layout: 'single-column',
      fields: [],
      createdAt: now,
      updatedAt: now,
    };
    setSchemas((prev) => [...prev, newSchema]);
    setSelectedSchemaId(id);
    setActiveTab('schema');
  };

  const handleUpdateSchema = (updated: FormSchema) => {
    setSchemas((prev) =>
      prev.map((s) => (s.id === updated.id ? updated : s))
    );
  };

  const handleDeleteSchema = (id: string) => {
    if (!confirm('Delete this schema and all its entries?')) return;
    setSchemas((prev) => prev.filter((s) => s.id !== id));
    setEntries((prev) => prev.filter((e) => e.schemaId !== id));
    setSelectedSchemaId((prevId) =>
      prevId === id ? (schemas[0]?.id ?? null) : prevId
    );
  };

  const handleFormSubmit = (data: Record<string, unknown>) => {
    if (!selectedSchema) return;
    const now = new Date().toISOString();
    const entry: FormEntry = {
      id: generateId(),
      schemaId: selectedSchema.id,
      createdAt: now,
      data,
    };
    setEntries((prev) => [entry, ...prev]);
    alert('Entry submitted successfully!');
  };

  const handleDeleteEntry = (entryId: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== entryId));
  };

  const handleClearEntries = () => {
    if (!confirm('Delete all entries for this form?')) return;
    if (!selectedSchema) return;
    setEntries((prev) => prev.filter((e) => e.schemaId !== selectedSchema.id));
  };

  const handleExportSchemas = () => {
    const dataStr = JSON.stringify(schemas, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'schemas.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSchemas: ChangeEventHandler<HTMLInputElement> = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = reader.result as string;
        const parsed = JSON.parse(text);
        const normalize = (raw: any): FormSchema => {
          const now = new Date().toISOString();
          return {
            id: raw.id ?? generateId(),
            name: raw.name ?? 'Imported Form',
            description: raw.description ?? '',
            layout: (raw.layout as FormLayout) ?? 'single-column',
            fields: raw.fields ?? [],
            createdAt: raw.createdAt ?? now,
            updatedAt: raw.updatedAt ?? now,
          };
        };

        const imported: FormSchema[] = Array.isArray(parsed)
          ? parsed.map(normalize)
          : [normalize(parsed)];

        setSchemas((prev) => [...prev, ...imported]);
        if (!selectedSchemaId && imported[0]) {
          setSelectedSchemaId(imported[0].id);
        }
        alert('Schemas imported successfully!');
      } catch (err) {
        console.error(err);
        alert('Failed to import schemas. Check JSON format.');
      } finally {
        event.target.value = '';
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="app-root">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>Dynamic Form Builder</h1>
          <p className="sidebar-subtitle">
            Define schemas, build forms, and view submitted data.
          </p>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-header">
            <h2>Forms</h2>
            <button type="button" className="btn primary" onClick={handleCreateSchema}>
              + New Form
            </button>
          </div>
          <SchemaList
            schemas={schemas}
            selectedSchemaId={selectedSchemaId}
            onSelect={setSelectedSchemaId}
            onDelete={handleDeleteSchema}
          />
        </div>

        <div className="sidebar-section">
          <h2>Schemas JSON</h2>
          <div className="sidebar-actions">
            <button
              type="button"
              className="btn secondary"
              onClick={handleExportSchemas}
              disabled={schemas.length === 0}
            >
              Export
            </button>

            <label className="btn secondary file-input-label">
              Import
              <input
                type="file"
                accept="application/json"
                onChange={handleImportSchemas}
                className="file-input-hidden"
              />
            </label>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        {!selectedSchema && (
          <div className="empty-state">
            <h2>No forms yet</h2>
            <p>Create your first form schema from the left sidebar.</p>
            <button
              type="button"
              className="btn primary"
              onClick={handleCreateSchema}
            >
              Create Form
            </button>
          </div>
        )}

        {selectedSchema && (
          <>
            {/* Header */}
            <header className="main-header">
              <div>
                <h2>{selectedSchema.name || 'Untitled Form'}</h2>
                {selectedSchema.description && (
                  <p className="text-muted">{selectedSchema.description}</p>
                )}
              </div>
              <div className="tab-list">
                <button
                  type="button"
                  className={`tab ${activeTab === 'form' ? 'active' : ''}`}
                  onClick={() => setActiveTab('form')}
                >
                  Form
                </button>
                <button
                  type="button"
                  className={`tab ${activeTab === 'entries' ? 'active' : ''}`}
                  onClick={() => setActiveTab('entries')}
                >
                  Data Viewer
                </button>
                <button
                  type="button"
                  className={`tab ${activeTab === 'schema' ? 'active' : ''}`}
                  onClick={() => setActiveTab('schema')}
                >
                  Schema Designer
                </button>
              </div>
            </header>

            <section className="main-section">
              {activeTab === 'schema' && (
                <SchemaEditor
                  schema={selectedSchema}
                  onChange={handleUpdateSchema}
                />
              )}

              {activeTab === 'form' && (
                <DynamicForm schema={selectedSchema} onSubmit={handleFormSubmit} />
              )}

              {activeTab === 'entries' && (
                <EntriesTable
                  schema={selectedSchema}
                  entries={schemaEntries}
                  onDeleteEntry={handleDeleteEntry}
                  onClearEntries={handleClearEntries}
                />
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
