import { useMemo, useState } from 'react';
import type { ChangeEventHandler } from 'react';

import type { FormEntry, FormSchema } from '../types';

interface Props {
  schema: FormSchema;
  entries: FormEntry[];
  onDeleteEntry: (entryId: string) => void;
  onClearEntries: () => void;
}

type SortDirection = 'asc' | 'desc';

export function EntriesTable({
  schema,
  entries,
  onDeleteEntry,
  onClearEntries,
}: Props) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const columns = useMemo(
    () => ['createdAt', ...schema.fields.map((f) => f.name)],
    [schema]
  );

  const filteredAndSorted = useMemo(() => {
    let rows = entries;

    if (search.trim() !== '') {
      const q = search.toLowerCase();
      rows = rows.filter((entry) => {
        const values: string[] = [];
        values.push(new Date(entry.createdAt).toLocaleString());
        schema.fields.forEach((f) => {
          const val = entry.data[f.name];
          values.push(String(val ?? ''));
        });
        return values.join(' ').toLowerCase().includes(q);
      });
    }

    const sorted = [...rows].sort((a, b) => {
      const dir = sortDirection === 'asc' ? 1 : -1;

      if (sortBy === 'createdAt') {
        const da = new Date(a.createdAt).getTime();
        const db = new Date(b.createdAt).getTime();
        if (da === db) return 0;
        return da < db ? -dir : dir;
      }

      const va = a.data[sortBy];
      const vb = b.data[sortBy];

      if (typeof va === 'number' && typeof vb === 'number') {
        if (va === vb) return 0;
        return va < vb ? -dir : dir;
      }

      const sa = String(va ?? '');
      const sb = String(vb ?? '');
      if (sa === sb) return 0;
      return sa < sb ? -dir : dir;
    });

    return sorted;
  }, [entries, search, sortBy, sortDirection, schema.fields]);

  const pageCount = Math.max(1, Math.ceil(filteredAndSorted.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);

  const pageItems = filteredAndSorted.slice(
    currentPage * pageSize,
    currentPage * pageSize + pageSize
  );

  const handleSort = (col: string) => {
    if (sortBy === col) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(col);
      setSortDirection('asc');
    }
  };

  const handlePageSizeChange: ChangeEventHandler<HTMLSelectElement> = (e) => {
    setPageSize(Number(e.target.value));
    setPage(0);
  };

  const handleExportCsv = () => {
    if (entries.length === 0) return;

    const header = ['Entry ID', 'Created At', ...schema.fields.map((f) => f.label)];

    const rows = entries.map((entry) => {
      const row: string[] = [];
      row.push(entry.id);
      row.push(new Date(entry.createdAt).toISOString());
      schema.fields.forEach((f) => {
        const value = entry.data[f.name];
        row.push(value == null ? '' : String(value));
      });
      return row;
    });

    const escape = (val: string) =>
      `"${val.replace(/"/g, '""')}"`;

    const csv = [header, ...rows]
      .map((r) => r.map(escape).join(','))
      .join('\r\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${schema.name || 'entries'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="card">
      <h3>Data Viewer</h3>
      <p className="text-muted">
        View submitted entries. Use search, sorting, and pagination to explore
        data. Entries persist in local storage.
      </p>

      <div className="table-toolbar">
        <div className="table-toolbar-left">
          <input
            type="search"
            placeholder="Search entries..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
          />
        </div>
        <div className="table-toolbar-right">
          <label>
            Page size
            <select value={pageSize} onChange={handlePageSizeChange}>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
            </select>
          </label>

          <button
            type="button"
            className="btn secondary"
            onClick={handleExportCsv}
            disabled={entries.length === 0}
          >
            Export CSV
          </button>

          <button
            type="button"
            className="btn danger"
            onClick={onClearEntries}
            disabled={entries.length === 0}
          >
            Clear All
          </button>
        </div>
      </div>

      {entries.length === 0 ? (
        <p className="text-muted">
          No entries submitted yet. Fill out the form to add entries.
        </p>
      ) : (
        <>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <SortableHeader
                    label="Created"
                    col="createdAt"
                    sortBy={sortBy}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                  {schema.fields.map((f) => (
                    <SortableHeader
                      key={f.name}
                      label={f.label}
                      col={f.name}
                      sortBy={sortBy}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                  ))}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((entry, idx) => (
                  <tr key={entry.id}>
                    <td>{currentPage * pageSize + idx + 1}</td>
                    <td>{new Date(entry.createdAt).toLocaleString()}</td>
                    {schema.fields.map((f) => (
                      <td key={f.name}>
                        {entry.data[f.name] == null
                          ? ''
                          : String(entry.data[f.name])}
                      </td>
                    ))}
                    <td>
                      <button
                        type="button"
                        className="btn ghost small"
                        onClick={() => onDeleteEntry(entry.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {pageItems.length === 0 && (
                  <tr>
                    <td colSpan={columns.length + 2}>
                      <em>No entries on this page.</em>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <button
              type="button"
              className="btn secondary"
              disabled={currentPage === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Previous
            </button>
            <span>
              Page {currentPage + 1} of {pageCount}
            </span>
            <button
              type="button"
              className="btn secondary"
              disabled={currentPage >= pageCount - 1}
              onClick={() =>
                setPage((p) => Math.min(pageCount - 1, p + 1))
              }
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}

interface SortableHeaderProps {
  label: string;
  col: string;
  sortBy: string;
  sortDirection: SortDirection;
  onSort: (col: string) => void;
}

function SortableHeader({
  label,
  col,
  sortBy,
  sortDirection,
  onSort,
}: SortableHeaderProps) {
  const isActive = sortBy === col;
  const indicator = !isActive ? '⇅' : sortDirection === 'asc' ? '↑' : '↓';

  return (
    <th>
      <button
        type="button"
        className="sort-header"
        onClick={() => onSort(col)}
      >
        <span>{label}</span>
        <span className="sort-indicator">{indicator}</span>
      </button>
    </th>
  );
}
