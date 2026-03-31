# ECMR Display Component (PrimeReact)

This is a PrimeReact version of the Angular ECMR Display component. It displays eCMR (electronic CMR) data parsed from XML.

## Files Structure

- `ECMRDisplay.tsx` - Main React component using PrimeReact
- `ecmrTypes.ts` - TypeScript type definitions
- `ecmrParser.ts` - XML parser utility
- `ecmrFormatter.ts` - Formatting utilities for addresses, parties, currencies, etc.
- `ECMRDisplay.module.css` - CSS module styles

## Dependencies

This component requires the following packages:

```json
{
  "react": "^18.0.0",
  "react-router-dom": "^6.0.0",
  "primereact": "^9.0.0",
  "primeicons": "^6.0.0"
}
```

## Usage

### 1. Install PrimeReact

```bash
npm install primereact primeicons
```

### 2. Import PrimeReact CSS

In your main application file (e.g., `App.tsx` or `index.tsx`):

```typescript
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
```

### 3. Set up React Router

Make sure you have React Router configured in your app:

```typescript
import { BrowserRouter } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      {/* Your routes */}
    </BrowserRouter>
  );
}
```

### 4. Use the Component

```typescript
import ECMRDisplay from './react-components/ECMRDisplay/ECMRDisplay';

// In your route configuration:
<Route path="/ecmr-display" element={<ECMRDisplay />} />
```

### 5. Navigate with Query Parameter

The component expects a base64-encoded XML string in the query parameter `data`:

```typescript
// Example navigation
const xmlBase64 = btoa(xmlString); // Encode XML to base64
navigate(`/ecmr-display?data=${xmlBase64}`);
```

## Component Features

- **Base64 XML Decoding**: Automatically decodes base64-encoded XML from URL query parameters
- **UTF-8 Support**: Properly handles Croatian characters (č, ć, š, đ, ž)
- **XML Parsing**: Parses XML and extracts eCMR data
- **Data Display**: Shows all eCMR fields organized in cards:
  - Header with eCMR ID, issue date, and location
  - Basic information (fields 1-5, 16-18)
  - Goods table (fields 6-12)
  - Instructions & Payment (fields 13-21)
  - Signatures (fields 22-24)
  - Vehicle & Tariff (fields 25-28)
  - **ADR / Opasna roba** - Dangerous Goods section with all ADR fields
- **Error Handling**: Displays error messages if XML parsing fails
- **Loading State**: Shows loading spinner while processing
- **Responsive Design**: Mobile-friendly layout
- **ADR Support**: Complete ADR (Dangerous Goods) data parsing and display

## PrimeReact Components Used

- `Card` - For main content sections
- `DataTable` - For goods table display
- `Message` - For error display
- `ProgressSpinner` - For loading state

## Styling

The component uses CSS modules. Styles are defined in `ECMRDisplay.module.css` and follow the same design as the Angular version.

## Differences from Angular Version

1. **Routing**: Uses `useSearchParams` from React Router instead of Angular Router
2. **State Management**: Uses React hooks (`useState`, `useEffect`) instead of Angular component properties
3. **Services**: Parser and formatter are utility functions instead of Angular services
4. **Templates**: Uses JSX instead of Angular templates
5. **Styling**: Uses CSS modules instead of component-scoped CSS

## ADR / Dangerous Goods Section

The component includes a complete ADR (Dangerous Goods) section that displays:
- All ADR fields are always visible (shows "—" when data is missing)
- Proper Shipping Name, UN Number, Hazard Classification
- Packaging and restriction codes
- Physical properties (weights, volumes, density, melting point)
- Radioactive material details (if applicable)
- Temperature requirements (control and emergency)
- Multiple ADR items support

## Notes

- The component maintains the same functionality and appearance as the Angular version
- All Croatian text labels are preserved
- The XML parsing logic is identical to the Angular service
- ADR section matches the Angular implementation exactly
- No POC/pilot switching - displays only ECMR and ADR cards


