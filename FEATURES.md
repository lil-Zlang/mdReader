# mdReader - Current Features

## Overview

**mdReader** is a modern web-based markdown reader and editor designed for viewing, editing, and managing markdown documentation locally. It provides a beautiful reading experience with intelligent file navigation and a WYSIWYG editor.

---

## Core Features

### 1. File Management

| Feature | Description |
|---------|-------------|
| **File Browser** | Sidebar listing all markdown files in the configured folder |
| **File Selection** | Click to view any markdown file |
| **Multi-select Mode** | Select multiple files with checkboxes (Shift+click for range) |
| **Select All** | One-click selection of all files |
| **Bulk Delete** | Delete multiple selected files with confirmation |
| **Real-time Sync** | WebSocket-based file watching - updates reflect when files change on disk |

### 2. Markdown Viewing

| Feature | Description |
|---------|-------------|
| **Rich Rendering** | Full GitHub-flavored markdown support |
| **Syntax Highlighting** | Code blocks with language-specific highlighting |
| **Tables** | Properly formatted markdown tables |
| **Images** | Inline image display with responsive sizing |
| **Links** | Internal markdown links and external URLs |
| **Task Lists** | Interactive checkboxes in markdown |

### 3. WYSIWYG Editing

| Feature | Description |
|---------|-------------|
| **Rich Text Editor** | TipTap-based editor with formatting toolbar |
| **Formatting Options** | Bold, italic, underline, strikethrough |
| **Headings** | H1-H6 heading levels |
| **Lists** | Bullet lists, numbered lists, task lists |
| **Code** | Inline code and code blocks |
| **Links & Images** | Insert and edit links and images |
| **Tables** | Create and edit tables |
| **Fullscreen Mode** | Distraction-free editing experience |
| **Width Toggle** | Switch between constrained and full-width editing |
| **Auto-save** | Save button with markdown conversion |

### 4. Table of Contents

| Feature | Description |
|---------|-------------|
| **Auto-generated TOC** | Extracts headings from document |
| **Click to Navigate** | Jump to any section by clicking |
| **Hierarchical Display** | Indented based on heading level |
| **Toggle Visibility** | Show/hide TOC panel |
| **Synchronized IDs** | Consistent heading IDs between TOC and content |

### 5. Navigation

| Feature | Description |
|---------|-------------|
| **Back/Forward** | Browser-like navigation history (Alt+Left/Right) |
| **Breadcrumbs** | Path display for nested files |
| **Search** | Full-text search across all files (Cmd+F) |
| **Keyboard Shortcuts** | Cmd+N (new), Cmd+T (TOC), Cmd+F (search) |

### 6. Knowledge Graph

| Feature | Description |
|---------|-------------|
| **Visual Graph** | Interactive node-based visualization |
| **File Connections** | Shows relationships between files |
| **Click to Open** | Navigate to files from graph view |
| **Pan & Zoom** | Canvas navigation controls |
| **Auto Layout** | Automatic node positioning |

### 7. File Creation

| Feature | Description |
|---------|-------------|
| **Upload** | Drag-and-drop or click to upload .md files |
| **Quick Note** | Create new markdown with title and content |
| **URL Import** | Fetch and convert web pages to markdown |
| **Empty State** | Welcoming UI when no files exist |

### 8. UI/UX Features

| Feature | Description |
|---------|-------------|
| **Responsive Design** | Works on desktop and tablet |
| **Toast Notifications** | Feedback for actions (save, delete, etc.) |
| **Loading States** | Skeleton loaders during data fetch |
| **Error Handling** | Graceful error messages |
| **Confirmation Dialogs** | Protect against accidental deletion |

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + F` | Open search |
| `Cmd/Ctrl + N` | New entry modal |
| `Cmd/Ctrl + T` | Toggle Table of Contents |
| `Alt + Left` | Navigate back |
| `Alt + Right` | Navigate forward |
| `Escape` | Exit fullscreen editing |

---

## Technical Stack

### Frontend (Client)

| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| TypeScript | Type safety |
| Vite | Build tool & dev server |
| TipTap | WYSIWYG editor |
| react-markdown | Markdown rendering |
| remark-gfm | GitHub-flavored markdown |
| rehype-highlight | Syntax highlighting |
| CSS Modules | Scoped styling |

### Backend (Server)

| Technology | Purpose |
|------------|---------|
| Node.js | Runtime |
| Express | HTTP server |
| TypeScript | Type safety |
| Chokidar | File system watching |
| WebSocket (ws) | Real-time updates |

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/config` | GET | Get server configuration |
| `/api/files` | GET | List all markdown files |
| `/api/files/:id` | GET | Get file content |
| `/api/files/:id` | PUT | Update file content |
| `/api/files/:id` | DELETE | Delete a file |
| `/api/files` | POST | Create new file |
| `/api/upload` | POST | Upload markdown file |
| `/api/fetch-url` | POST | Fetch URL and convert to markdown |
| `/ws` | WebSocket | Real-time file change notifications |

---

## File Structure

```
mdReader/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/
│   │   │   ├── Breadcrumb/
│   │   │   ├── ConfirmationModal/
│   │   │   ├── EmptyFilesManager/
│   │   │   ├── FileWhiteboard/      # Knowledge graph
│   │   │   ├── Layout/              # Main layout
│   │   │   ├── MarkdownViewer/      # Markdown display & edit
│   │   │   ├── NewEntryModal/       # File creation
│   │   │   ├── RichTextEditor/      # WYSIWYG editor
│   │   │   ├── SearchBar/
│   │   │   ├── TableOfContents/
│   │   │   ├── Toast/
│   │   │   └── WelcomeScreen/
│   │   ├── hooks/
│   │   │   ├── useNavigationHistory.ts
│   │   │   └── useWebSocket.ts
│   │   ├── utils/
│   │   │   ├── markdownConverter.ts  # HTML ↔ Markdown
│   │   │   └── slugify.ts            # Heading ID generation
│   │   └── index.css                 # Global styles & variables
│   └── package.json
│
├── server/                 # Backend Express server
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   └── index.ts
│   └── package.json
│
├── PRD.md                  # Product Requirements (Markform integration)
└── FEATURES.md             # This file
```

---

## Design System

The application uses a warm, Anthropic-inspired design with:

- **Colors**: Warm whites, terracotta accents, sage greens
- **Typography**: Display fonts for headings, clean sans-serif for body
- **Spacing**: Consistent spacing scale using CSS variables
- **Shadows**: Subtle depth with warm-toned shadows
- **Transitions**: Smooth 150-200ms animations

---

## Current Limitations

1. **Single User** - No authentication or multi-user support
2. **Local Only** - Files must be on the local filesystem
3. **No Version History** - No undo/redo beyond current session
4. **No Mobile** - Not optimized for phone screens
5. **English Only** - No internationalization

---

## Planned Features (See PRD.md)

- Markform integration for structured forms
- AI-assisted field completion
- Multi-format export (JSON, YAML)
- Template library
- Validation system

---

*Last updated: January 2026*
