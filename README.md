# mdr - Beautiful Markdown Reader

The fastest, most beautiful way to read and navigate markdown documentation locally.

```bash
mdr ./docs
```

## Features

✨ **Beautiful Markdown Rendering** - Syntax highlighting, tables, lists, and more
🔗 **Auto-Detected Backlinks** - Automatically finds connections between documents
🔍 **Full-Text Search** - Search across all files with real-time results
📍 **Smart Navigation** - Breadcrumbs, back/forward, Table of Contents
⚡ **Real-Time Sync** - Automatically detects and updates when files change
📱 **Responsive Design** - Works great on desktop and tablet

## Quick Start

### Install from source

```bash
git clone https://github.com/yourusername/mdreader.git
cd mdreader
npm install
npm run build
npm link -w cli
```

### Usage

```bash
# Open current directory
mdr

# Open a specific folder
mdr ./my-docs

# Open a specific file (opens the containing folder)
mdr ./README.md

# Specify a port
mdr ./docs --port 8080

# Don't auto-open browser
mdr ./docs --no-open
```

The browser opens automatically and you can view your markdown files with beautiful rendering.

## CLI Options

```
Usage: mdr [options] [path]

Beautiful markdown reader in your browser

Arguments:
  path                 Path to markdown file or folder (default: ".")

Options:
  -V, --version        output the version number
  -p, --port <number>  Port to run on (default: auto-detect)
  --no-open            Don't open browser automatically
  -h, --help           display help for command
```

## Project Structure

```
mdReader/
├── cli/                 # CLI entry point
├── client/              # React frontend (Vite + TypeScript)
├── server/              # Node.js/Express backend
├── shared/              # Shared TypeScript types
└── package.json         # Root monorepo configuration
```

## Development

### Prerequisites

- Node.js 18+ and npm 8+

### Setup

```bash
npm install
npm run build
```

### Development Mode

```bash
# Terminal 1: Start backend
npm run server

# Terminal 2: Start frontend
npm run client
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## Using the UI

### Navigation

- **Browse Files**: Click files in the left sidebar to view them
- **Search**: Press `Ctrl+F` (or `Cmd+F` on Mac) to open search
- **Back/Forward**: Press `Alt+Left/Right` arrows or use the buttons
- **Toggle TOC**: Press `Ctrl+T` to show/hide Table of Contents
- **Toggle Links**: Click "Show/Hide Links" to see backlinks panel

### Features

#### Beautiful Markdown Rendering

- Headers with proper styling (H1-H6)
- GitHub-flavored markdown (tables, strikethrough, task lists)
- Syntax highlighting for code blocks
- Proper list formatting (ordered, unordered, nested)
- Image support with relative path handling
- Blockquotes and horizontal rules

#### Navigation

- **Breadcrumb Trail**: Shows current file location (Home > folder > file.md)
- **Back/Forward Navigation**: Browser-like navigation with history (Alt+Left/Right)
- **Table of Contents**: Auto-generated from markdown headings, click to jump
- **Link Panels**: See files that reference the current file and files it references

#### Search

- **Full-Text Search**: Find content across all files
- **Real-Time Results**: Results update as you type (300ms debounce)
- **Navigation**: Click results to jump to matching files
- **Arrow Keys**: Navigate between search results

#### Backlinks

- **Linked From**: See which files reference the current file
- **Links To**: See what files the current file links to
- **Context**: View the surrounding text of each link
- **Click to Navigate**: Jump to linked files

#### Real-Time Updates

- **Auto-Detection**: Changes to files are automatically detected
- **Live Updates**: File list updates when files are added/deleted
- **Notifications**: Toast messages notify you of changes
- **Smart Refresh**: Currently viewed file refreshes when modified

## API Endpoints

### Configuration

- `POST /api/config` - Set markdown folder path
- `GET /api/config` - Get current configuration

### Files

- `GET /api/files` - List all markdown files
- `GET /api/files/:fileId` - Get file content

### Backlinks (Auto-Detected)

- `GET /api/backlinks/:fileId` - Get auto-detected backlinks

### Search

- `GET /api/search?q=query` - Full-text search

### WebSocket Events

- `file:added` - New file detected
- `file:modified` - File content changed
- `file:deleted` - File removed
- `file:renamed` - File renamed

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+F` / `Cmd+F` | Open search |
| `Alt+←` | Go back |
| `Alt+→` | Go forward |
| `Ctrl+T` / `Cmd+T` | Toggle Table of Contents |
| `Escape` | Close search or dialogs |

## Error Handling

The application handles these common scenarios gracefully:

- **No Folder Selected**: Welcome screen guides you to select a folder
- **Permission Denied**: Clear error message with suggestions
- **Empty Folder**: Friendly message "No markdown files found"
- **File Not Found**: Graceful fallback if file is deleted
- **Broken Links**: Links to deleted files appear grayed out
- **Large Files**: Handles files up to 10MB
- **Special Characters**: Supports Unicode, spaces, and special chars in filenames

## Performance

- **File Scanning**: < 1s for 200 files
- **File Rendering**: < 500ms for typical documents
- **Search**: < 300ms for searching 100 files
- **Graph**: Supports up to 500 nodes
- **Memory**: Efficient caching and lazy loading

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Configuration

### Environment Variables

Create a `.env` file in the server directory:

```env
PORT=3001
NODE_ENV=development
```

### Client Settings

Settings are stored in browser localStorage:

```json
{
  "markdownFolderPath": "/path/to/markdown/files"
}
```

## Troubleshooting

### Files Not Showing

1. Check the folder path is correct
2. Ensure files have `.md` extension
3. Check file permissions (readable)
4. Restart the server and refresh the page

### Search Not Working

1. Check that files are loaded in the sidebar
2. Try a simpler search query
3. Ensure files contain the search text
4. Check browser console for errors (F12)

### WebSocket Connection Issues

1. Check browser console for connection errors
2. Verify server is running on port 3001
3. Check firewall/proxy settings
4. Try refreshing the page

### Markdown Not Rendering Properly

1. Verify the markdown syntax is correct
2. Check that images use relative paths
3. Ensure code block language is specified
4. Try a simpler markdown example

## Development Notes

### Technology Stack

**Frontend:**
- React 18 with TypeScript
- Vite for fast development and building
- react-markdown for rendering
- Zustand for state management
- Socket.io-client for real-time updates

**Backend:**
- Express.js for API server
- Socket.io for WebSocket
- Chokidar for file watching
- Fuse.js for full-text search
- Glob for file pattern matching

### File Structure

```
client/src/
├── components/         # React components
│   ├── Layout/        # Main layout container
│   ├── MarkdownViewer/ # Markdown rendering
│   ├── FileList/      # File browser
│   ├── SearchBar/     # Search interface
│   ├── BacklinksPanel/ # Link visualization
│   ├── Breadcrumb/    # Navigation breadcrumb
│   ├── TableOfContents/ # TOC sidebar
│   └── Toast/         # Notifications
├── hooks/             # Custom React hooks
├── services/          # API client
└── stores/            # State management

server/src/
├── controllers/        # Route handlers
├── services/          # Business logic
├── routes/            # API routes
└── utils/             # Utilities
```

## Future Enhancements (V2)

- Graph visualization (force-directed layout)
- Split-pane multi-file viewing
- Manual connection creation
- Advanced search operators
- YAML frontmatter parsing
- Markdown editing mode
- Export to PDF/HTML
- Dark mode
- Custom themes

## License

MIT

## Contributing

Contributions welcome! Please follow the existing code style and include tests.

## Support

For issues and feature requests, please open an issue on the project repository.

---

**Built with ❤️ for beautiful markdown reading**
