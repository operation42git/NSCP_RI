# IdentifiersSearch React Component

React component for the identifier search UI, matching the Angular identifiers-search component.

## Features

- Search form: identifier, identifier type (multi-select), registration country, transport mode, dangerous goods, eFTI gate
- Result cards with compact two-row layout
- Expandable cards with transport movement and equipment details
- ADR styling when dangerous goods are present
- Trailer icon for equipment, container icon for carried equipment
- Croatian and English translations

## Dependencies

```json
{
  "react": "^18.0.0",
  "react-dom": "^18.0.0"
}
```

Font Awesome is used for icons (fa-trailer, fa-box, fa-chevron-right, etc.). Ensure Font Awesome CSS is loaded in your app.

## Usage

```tsx
import IdentifiersSearch from './react-components/IdentifiersSearch/IdentifiersSearch';

// In your React app:
<IdentifiersSearch
  locale="hr"
  identifiersDisplayBaseUrl="/identifiers-display"
  onOpenIdentifier={(identifier) => {
    // Optional: handle opening identifier (e.g. navigate, store in localStorage)
    window.open(`/identifiers-display/${identifier.datasetId}`, '_blank');
  }}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `locale` | `'hr' \| 'en'` | `'hr'` | UI language |
| `identifiersDisplayBaseUrl` | `string` | `'/identifiers-display'` | Base URL for the identifier display page |
| `onOpenIdentifier` | `(identifier: Identifier) => void` | — | Callback when user clicks Open. If not provided, uses `window.open` |

## API

The component calls:
- `POST /api/control/identifiers` — submit search
- `GET /api/control/identifiers?requestId=...` — poll for results

Ensure your app proxies or configures these endpoints correctly.

## Integration with React Router

If using React Router, add a route:

```tsx
<Route path="/identifiers-search" element={<IdentifiersSearch />} />
```
