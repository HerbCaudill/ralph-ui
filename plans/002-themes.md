# VS Code Theme Support Implementation Plan

## Summary

Add full VS Code theme support to ralph-ui:

- Auto-detect user's current VS Code theme on startup
- Discover all locally installed VS Code themes
- Map VS Code UI colors to app CSS variables
- Syntax highlighting for code blocks using Shiki
- Theme-aware status colors throughout the app

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Express Server                        │
│  - Scans ~/.vscode/extensions for theme extensions      │
│  - Reads VS Code settings.json for current theme        │
│  - Serves theme list + theme JSON via API               │
└─────────────────────────────────────────────────────────┘
                          │
                    GET /api/themes
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    Theme Provider                        │
│  - Parses VS Code JSON → CSS variables                  │
│  - Provides Shiki highlighter with matching theme       │
└─────────────────────────────────────────────────────────┘
                          │
      ┌───────────────────┼───────────────────┐
      ▼                   ▼                   ▼
 CSS Variables      Shiki Instance      Status Colors
 (UI styling)       (code blocks)       (semantic)
```

## File Structure

```
server/
├── ThemeDiscovery.ts     # Scan VS Code extensions, read settings
└── index.ts              # Add /api/themes routes

src/
├── lib/theme/
│   ├── index.ts          # Exports
│   ├── types.ts          # VSCodeTheme, AppTheme types
│   ├── parser.ts         # Parse VS Code JSON
│   ├── mapper.ts         # VS Code → CSS variables
│   └── highlighter.ts    # Shiki singleton
├── hooks/
│   └── useVSCodeTheme.ts # Theme state & application
└── components/theme/
    ├── ThemePicker.tsx   # Theme selection UI
    └── CodeBlock.tsx     # Syntax-highlighted code
```

## Implementation Phases

### Phase 0: VS Code Theme Discovery (Server)

**0.1 ThemeDiscovery class** (`server/ThemeDiscovery.ts`)

Locate VS Code installation:

- macOS: `~/Library/Application Support/Code/User/settings.json`
- Also check: Cursor, VSCodium, Code - Insiders
- Fall back gracefully if not found

Scan extensions for themes:

- Read `~/.vscode/extensions/*/package.json`
- Find `contributes.themes` array
- Extract theme metadata: label, path, uiTheme (dark/light)
- Load theme JSON from relative path

**0.2 API Endpoints** (`server/index.ts`)

```
GET /api/themes
  → { current: string, themes: ThemeMeta[] }

GET /api/themes/:id
  → Full VS Code theme JSON
```

**0.3 ThemeMeta type**

```ts
type ThemeMeta = {
  id: string // "github.github-vscode-theme/GitHub Dark"
  label: string // "GitHub Dark"
  type: "dark" | "light"
  path: string // Full path to theme JSON
  extensionId: string // "github.github-vscode-theme"
}
```

### Phase 1: Theme Infrastructure (Client)

**1.1 Types** (`src/lib/theme/types.ts`)

- `VSCodeTheme`: Raw VS Code JSON structure
- `AppTheme`: Mapped CSS variable values
- `StatusColors`: Semantic status color set

**1.2 Parser** (`src/lib/theme/parser.ts`)

- Parse and validate VS Code theme JSON
- Extract `colors` and `tokenColors`

**1.3 Mapper** (`src/lib/theme/mapper.ts`)

Map VS Code tokens to app tokens with fallback chains:

| App Token       | VS Code Primary          | Fallback            |
| --------------- | ------------------------ | ------------------- |
| `--background`  | `editor.background`      | theme type default  |
| `--foreground`  | `editor.foreground`      | theme type default  |
| `--primary`     | `focusBorder`            | `button.background` |
| `--muted`       | `input.background`       | derive from bg      |
| `--border`      | `panel.border`           | derive from bg      |
| `--destructive` | `editorError.foreground` | `#ef4444`           |

Status colors from terminal ANSI:
| Status | VS Code Color |
|--------|---------------|
| success | `terminal.ansiGreen` |
| info | `terminal.ansiBlue` |
| error | `terminal.ansiRed` |
| warning | `terminal.ansiYellow` |
| neutral | `foreground` at 50% |

**1.4 Apply to Document**

- Set CSS custom properties on `:root`
- Detect light/dark from theme `type` field

### Phase 2: Syntax Highlighting

**2.1 Shiki Setup** (`src/lib/theme/highlighter.ts`)

- Lazy-initialized singleton
- `loadTheme()` for dynamic theme switching
- `highlight(code, lang)` wrapper

**2.2 CodeBlock Component** (`src/components/theme/CodeBlock.tsx`)

- Renders highlighted HTML from Shiki
- Language detection from fence
- Copy button, optional line numbers

**2.3 Markdown Integration**

- Custom code component for react-markdown
- Suspense boundary for async highlighting

### Phase 3: Replace Hardcoded Colors

Add status CSS variables to `index.css`:

```css
:root {
  --status-success: oklch(0.7 0.15 145);
  --status-warning: oklch(0.8 0.15 85);
  --status-error: oklch(0.65 0.2 25);
  --status-info: oklch(0.65 0.15 250);
  --status-neutral: oklch(0.5 0 0);
}
```

Update components:
| File | Change |
|------|--------|
| `TaskCard.tsx` | Status badge colors |
| `ToolUseCard.tsx` | Diff colors, todo status |
| `StatusBar.tsx` | Ralph status indicator |
| `AssistantText.tsx` | Link color |
| `WorkspacePicker.tsx` | Error states |

### Phase 4: Theme UI & Persistence

**4.1 Store Extension**

```ts
themeId: string | null           // "github.github-vscode-theme/GitHub Dark"
availableThemes: ThemeMeta[]     // From /api/themes
```

**4.2 useVSCodeTheme Hook**

- Fetch available themes from `/api/themes` on mount
- Auto-apply current VS Code theme on first load
- Apply theme to document + Shiki
- `setTheme(id)` fetches full theme from `/api/themes/:id`
- `previewTheme(id)` for hover preview (temporary, not persisted)
- Persist selection to localStorage

**4.3 ThemePicker Component** (Header dropdown)

- Dropdown menu in header (like VS Code's theme picker)
- Groups: "Dark Themes" / "Light Themes"
- Current VS Code theme marked with indicator
- Preview on hover: theme applies temporarily while hovering
- Revert to current theme when hover ends (unless clicked to confirm)

## Dependencies

```json
{
  "shiki": "^1.x"
}
```

## Data Flow

```
App startup
     ↓
GET /api/themes (server scans VS Code extensions)
     ↓
useVSCodeTheme auto-applies current VS Code theme
     ↓
User selects theme from picker
     ↓
GET /api/themes/:id (fetch full theme JSON)
     ↓
   ┌────┴────┐
   ↓         ↓
Mapper    Shiki.loadTheme()
   ↓         ↓
CSS vars  Highlighter ready
   ↓
Components render with new values
```

## Verification

1. App loads → auto-detects and applies VS Code's current theme
2. Theme picker shows all installed VS Code themes
3. Select different themes → UI colors change appropriately
4. View code blocks → syntax highlighting matches theme
5. Refresh page → selected theme persists
6. Status indicators → use theme colors, maintain contrast
7. Run `pnpm test` → unit tests pass
8. Run `pnpm typecheck` → no type errors

## Decisions

- **Theme source**: Discover from local VS Code installation
- **Theme UI**: Header dropdown menu
- **Preview**: Live preview on hover (like VS Code)
- **Color format**: Keep hex (simpler, works with Tailwind)
