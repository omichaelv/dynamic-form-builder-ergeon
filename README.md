# Dynamic Form Builder & Data Viewer

This project is a solution for the **“Take-Home Assignment – Dynamic Form Builder & Data Viewer”**.

It is a React application that lets users:

- Define and manage **dynamic form schemas**
- Generate forms automatically from those schemas
- Validate user input based on schema rules
- View submitted entries with **pagination**, **sorting**, **filtering/search**
- Persist schemas and entries across page reloads

It also implements the **stretch goals**:

- Multiple form layouts (single-column / two-column)
- Import / export schemas as JSON
- Export submitted entries as CSV

---

## Features

### 1. Schema Management

- Create, edit, and delete schemas in the **Schema Designer** tab
- Each schema contains:
  - Name, description
  - Layout: `single-column` or `two-column`
  - List of fields
- Field configuration:
  - Types: `text`, `number`, `date`, `select`
  - Required / optional
  - Placeholder text
  - Number constraints: `min`, `max`
  - Text pattern validation: **regex** (e.g. email format)
  - Select options (comma-separated list)

### 2. Dynamic Form Generation

- Forms are generated automatically from the active schema.
- Layout is controlled by the schema (`single-column` or `two-column`).
- Changing a schema immediately affects the rendered form.

### 3. Validation

- Client-side validation driven by the schema:
  - Required fields
  - Number range (`min`, `max`)
  - Regex pattern for text input
- Validation errors are shown inline under each field.

### 4. Data Viewer

- Submitted entries appear in the **Data Viewer** tab.
- Includes:
  - Table view with columns based on schema fields
  - Pagination (page size selectable: 5 / 10 / 25)
  - Sorting by created date or any field (ascending/descending)
  - Search across all visible columns
  - Delete individual entries
  - Clear all entries for the current schema
- **CSV export** button to download all entries for the current schema.

### 5. Persistence

- Both **schemas** and **entries** are stored in `localStorage`.
- Data survives page reloads.

### 6. Import / Export Schemas

- **Export** button:
  - Downloads all current schemas as `schemas.json`.
- **Import** button:
  - Reads a JSON file and merges the imported schemas with existing ones.
  - Supports:
    - An array of schemas (`[ ... ]`)
    - A single schema objec
