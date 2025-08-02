# Stockfish Components

A reusable React component library using Tailwind CSS and TypeScript.

## Installation

```bash
npm install stockfish-components
# or
yarn add stockfish-components
# or
pnpm add stockfish-components
```

## Usage

### Method 1: Import with automatic CSS (Recommended)

```tsx
import React from 'react';
import { TextEditor } from 'stockfish-components';
// CSS is automatically imported when you import the components

function App() {
  const [content, setContent] = useState('');

  return (
    <div>
      <TextEditor
        value={content}
        onChange={setContent}
        placeholder="Start typing..."
      />
    </div>
  );
}
```
### Method 2: CSS-in-JS bundlers

If you're using a bundler that doesn't support CSS imports, make sure to include the CSS file in your build process or import it in your main CSS file:

```css
/* In your main CSS file */
@import 'stockfish-components/style.css';
# or
@import 'stockfish-components/dist/index.css';
```

## Components

### TextEditor

A rich text editor component with formatting options.

#### Props

- `value` (string): The current content of the editor
- `onChange` (function): Callback function called when content changes
- `placeholder` (string): Placeholder text when editor is empty

## Development

### Building the library

```bash
pnpm run build
```

### Development mode

```bash
pnpm run dev
```

## Notes

- This library includes Tailwind CSS styles. Make sure your application doesn't have conflicting CSS reset styles.
- The library uses React 18+ and requires `react` and `react-dom` as peer dependencies.
- All Tailwind CSS classes used by the components are included in the distributed CSS file.

## License

MIT
