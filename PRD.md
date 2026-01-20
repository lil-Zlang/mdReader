# Markdown Reader & Visualizer - Product Requirements Document

## Executive Summary

This document outlines the requirements for **mdReader**, a lightweight web-based markdown reader designed to replace raw terminal viewing with beautiful, formatted markdown and easy file navigation. The core focus is providing an excellent reading and browsing experience with intelligent file discovery and cross-file navigation.

## Product Overview

### Problem Statement
Users viewing markdown files in the terminal see raw text without formatting or visual structure, making it difficult to read and understand content. Additionally, navigating between related files requires manual terminal navigation, and there's no quick way to search across multiple documents.

### Solution
mdReader provides a modern web interface for:
- **Beautiful markdown rendering** - Headers, lists, code blocks, tables, formatting (core value)
- **Fast navigation** - Jump between files, back/forward history, breadcrumb trails
- **Full-text search** - Find content across all files quickly (Phase 2 priority)
- **Automatic backlinks** - See which other files reference the current file
- **Simple file discovery** - Lightweight graph visualization showing file relationships (read-only, no manual link creation in v1)
- **Multi-file viewing** - Split-pane view for comparing documents
- **Real-time sync** - Updates reflect when files change on disk

### Core Value Proposition
**The fastest, most beautiful way to read and navigate markdown documentation locally** - No installation overhead, no lock-in to proprietary formats, works with any markdown folder.

### Target User (Primary)
- **Developers & Documentation Managers** - Managing markdown-based docs (GitHub wikis, API docs, internal knowledge bases)
  - Want fast markdown viewing in a browser (better than `cat` or IDE preview)
  - Need quick search across documentation
  - Benefit from seeing how docs link together
  - Value simplicity and speed over advanced features

### Secondary Users
- Technical writers and knowledge base curators
- Researchers maintaining interconnected notes (but will likely prefer Obsidian's richer ecosystem)

## Functional Requirements

### 1. File Management

#### 1.1 File Listing
- **Input:** User selects a folder containing markdown files
- **Output:** Hierarchical tree view of all markdown files in the folder
- **Behavior:**
  - Display files recursively with folder nesting
  - Support collapsible folder groups
  - Show file metadata on hover (size, modified date)
  - Support filtering by file name
  - Sort by name, date modified, or file size

#### 1.2 File Content Display
- **Input:** User clicks on a markdown file in the list
- **Output:** Rendered markdown content in viewer
- **Features:**
  - Render with proper markdown formatting (not raw text)
  - Support GitHub Flavored Markdown (GFM):
    - Tables
    - Strikethrough
    - Task lists
    - Autolinks
  - Syntax highlighting for code blocks
  - Proper formatting for headers, lists, bold, italic
  - Render images with correct paths
  - Handle internal links to other markdown files
  - Optional: Math rendering support (LaTeX)

#### 1.3 Onboarding & First Launch
- **Initial Setup (First Time):**
  - Welcome screen with folder picker
  - Simple instructions: "Select folder containing your .md files"
  - File list populates after folder selected
  - Quick tips modal (optional, can dismiss)

#### 1.4 Navigation Features
- **Breadcrumb Trail:**
  - Show path of viewed files (Home > docs > api.md)
  - Click breadcrumb to jump back

- **Back/Forward History:**
  - Keyboard shortcuts: `Alt+Left` (back), `Alt+Right` (forward)
  - Browser-like navigation between recently viewed files

- **Table of Contents (for long files):**
  - Auto-generated from markdown headings
  - Sidebar panel showing hierarchy
  - Click heading to jump to section

#### 1.5 Configuration
- **Input:** User specifies markdown folder path
- **Output:** Application reads from that folder
- **Features:**
  - First launch: folder picker modal
  - Settings page to change folder path
  - Recent folders for quick switching
  - Configuration stored in browser localStorage

### 2. Automatic Backlinks (V1) - No Manual Connections

#### 2.1 Auto-Detect Links Between Files
- **Input:** Scan markdown files for links to other files
- **Output:** Display bidirectional relationships automatically
- **Features (V1 - MVP):**
  - Parse markdown links: `[text](other-file.md)` and `[[wiki-style links]]`
  - Automatically detect which files reference the current file
  - No manual connection creation required in v1
  - Zero friction - relationships discovered automatically

#### 2.2 View Backlinks
- **Input:** User opens a markdown file
- **Output:** Display files that link to this file
- **Features:**
  - Show "Linked From" section (files that reference this file)
  - Show "Links To" section (files this file references)
  - Click to navigate to linked file
  - Show context (link text from markdown)

#### 2.3 Future Enhancement: Manual Connections (V2+)
- Manual connection creation for relationships not expressed as links
- Connection types: related, references, extends, custom
- Metadata: labels, descriptions
- Stored in optional connections.json
- **This moves to Phase 2 after v1 validation**

### 3. Lightweight Graph Visualization (Optional Panel - V1)

#### 3.1 Network Graph Display
- **Input:** All markdown files and their backlinks
- **Output:** Simple interactive visualization
- **Features (V1 - Simplified):**
  - Each file is a node in the graph
  - Auto-detected links are edges between nodes
  - Nodes labeled with file names
  - Basic physics layout (force-directed, sufficient for 100-200 nodes)
  - Displays on sidebar panel (not separate tab - always available)
  - Toggle graph visibility with button

#### 3.2 Graph Interactions
- **Features:**
  - **Zoom & Pan:** Mouse wheel zoom, drag to pan (basic)
  - **Node Click:** Click node → open file in main viewer
  - **Node Hover:** Highlight node and immediate connections
  - **Show/Hide:** Toggle graph panel for cleaner interface

#### 3.3 Graph Limitations (V1)
- Read-only visualization (no manual editing connections in graph)
- No physics parameter tuning
- No export/image generation
- Node size consistent (not based on metrics)
- Performance optimized for 200-300 nodes; larger graphs may be slow
- **Advanced graph features deferred to V2**

### 4. Search & Filter

#### 4.1 Full-Text Search
- **Input:** User enters search query
- **Output:** List of matching files with context
- **Features:**
  - Fuzzy search across file names and content
  - Real-time search as user types (debounced)
  - Autocomplete suggestions
  - Case-insensitive matching
  - Return search results with:
    - File name
    - Matching line numbers
    - Context (surrounding lines)
    - Relevance score/ranking

#### 4.2 Advanced Search (V2+)
- **Deferred Features:**
  - Search operators: `filename:`, `before:`, `after:` (Phase 2)
  - Save search queries (Phase 2)
  - These add complexity; focus on simple search first

#### 4.3 Result Navigation
- **Features:**
  - Click result → open file and jump to match
  - Highlight all matches within the file
  - Navigate between matches with keyboard arrows
  - Show result count

### 5. Split-Pane View

#### 5.1 Multiple File Viewing
- **Input:** User opens multiple files
- **Output:** Multiple files displayed side-by-side
- **Features:**
  - Support 2 or 3 panes simultaneously
  - Horizontal or vertical split orientation
  - Resizable panes (drag divider)
  - Each pane independently scrollable
  - Each pane can display different file
  - Close individual panes

#### 5.2 Pane Management
- **Features:**
  - Open file in new pane from file list
  - Swap pane contents
  - Save pane layout preference to browser
  - Restore layout on next visit

### 6. Real-Time Updates

#### 6.1 File Change Detection
- **Input:** File modified externally (outside the web app)
- **Output:** Application reflects changes
- **Behavior:**
  - Monitor markdown folder for file changes
  - Detect new files
  - Detect modified files
  - Detect deleted files
  - Detect file renames

#### 6.2 User Notifications
- **Features:**
  - Show notification when file being viewed is modified
  - Auto-refresh or prompt to reload
  - Show notification when new files added
  - Show notification when files deleted
  - Real-time update to file list

#### 6.3 Synchronization
- **Features:**
  - Use WebSocket for real-time communication
  - Broadcast changes to all connected clients
  - Handle connection loss gracefully
  - Reconnect and sync when connection restored

## Non-Functional Requirements

### Performance
- **File List:** Load 100+ files without lag
- **File Rendering:** Render files up to 1MB quickly
- **Search:** Return results within 300ms for 100+ files
- **Graph:** Render 500+ nodes with smooth interactions
- **Memory:** Use reasonable memory for file caching

### Scalability
- Support 500+ markdown files
- Support graphs with 1000+ connections
- Handle rapid file changes (multiple per second)
- Cache frequently accessed files

### Reliability
- Graceful error handling for:
  - Invalid file paths
  - Permission errors
  - Corrupted markdown files
  - File system errors
- Prevent data loss when saving connections
- Atomic writes to connections.json

### Security
- Prevent path traversal attacks (restrict to selected folder)
- Validate all file paths
- Limit file size (e.g., 10MB max)
- Input validation on all API endpoints
- CORS configuration for production

### Usability
- Intuitive UI with clear visual hierarchy
- Keyboard shortcuts for common operations:
  - `Ctrl+F` / `Cmd+F` - Open search
  - `Ctrl+K` / `Cmd+K` - File switcher
  - `Escape` - Close modals
  - Arrow keys - Navigate search results
- Responsive design (works on different screen sizes)
- Dark/light theme support (optional)

### Accessibility
- Proper heading hierarchy in rendered markdown
- Alt text for images
- Keyboard navigation throughout app
- ARIA labels for UI elements
- High contrast for readability

## Technical Architecture

### Technology Stack

**Frontend:**
- React 18+ (UI framework)
- Vite (build tool)
- TypeScript (type safety)
- react-markdown (markdown rendering)
- react-force-graph-2d (graph visualization)
- react-split-pane (multi-pane view)
- Zustand (state management)
- Socket.io-client (real-time communication)

**Backend:**
- Node.js + Express (web server)
- TypeScript (type safety)
- Chokidar (file watching)
- Fuse.js (full-text search)
- Socket.io (WebSocket)
- fs-extra (file operations)

**Data Storage:**
- connections.json (file relationships)
- File system (markdown files)

### API Endpoints

```
Files:
  GET    /api/files                 - List all markdown files
  GET    /api/files/:fileId         - Get file content and metadata
  POST   /api/config                - Set markdown folder path
  GET    /api/config                - Get current configuration

Connections:
  GET    /api/connections           - Get all connections
  POST   /api/connections           - Create new connection
  PUT    /api/connections/:id       - Update connection
  DELETE /api/connections/:id       - Delete connection
  GET    /api/connections/file/:fileId - Get connections for specific file

Graph:
  GET    /api/graph                 - Get graph data (all nodes and edges)
  GET    /api/graph/:fileId         - Get subgraph centered on file

Search:
  GET    /api/search?q=query        - Search files (full-text)
```

### Data Models

**MarkdownFile:**
- id: string (stable UUID, stored in file metadata/frontmatter for v2+)
- relativePath: string (relative path from root folder)
- name: string (file name)
- path: string (full path)
- content: string (optional, loaded on demand)
- metadata:
  - size: number (bytes)
  - createdAt: date
  - modifiedAt: date
  - hash: string (for change detection)

**Auto-Detected Backlinks (V1):**
- Auto-parsed from markdown: `[text](other-file.md)` and `[[wiki-links]]`
- No data persistence required (regenerated on each scan)
- Bidirectional: If A links to B, automatically show B links from A

**Manual Connections (V2+):**
- id: string (UUID)
- sourceFileId: string (reference to file)
- targetFileId: string (reference to file)
- type: enum (related, references, extends, custom)
- label: string (optional)
- metadata:
  - createdAt: date
  - updatedAt: date
  - description: string (optional)
- Storage: connections.json file (future)

## User Workflows

### Workflow 1: First-Time Setup (Onboarding)
1. User opens application
2. Welcome screen appears
3. User clicks "Select Folder"
4. Folder picker opens
5. User navigates to folder containing .md files and selects it
6. Application scans folder and displays file list
7. Quick tips modal shown (optional)
8. Ready to use

### Workflow 2: Read & Navigate Files
1. User sees file list in left sidebar
2. User clicks on file to open
3. Markdown renders beautifully in main area (headers, lists, code blocks, formatting)
4. User clicks markdown link `[text](other-file.md)` to jump to another file
5. Breadcrumb shows current path: Home > docs > api.md
6. User can click breadcrumb to go back
7. Or use Alt+Left/Alt+Right for browser-like navigation

### Workflow 3: View Related Files (Automatic Backlinks)
1. User opens a file
2. "Linked From" section appears showing files that reference this file
3. "Links To" section shows files this file references
4. User can click any link to navigate (no manual setup needed)
5. All relationships auto-detected from markdown links

### Workflow 4: Visualize Knowledge Graph
1. User clicks "Show Graph" button in sidebar
2. Interactive graph appears showing all files as nodes
3. Links between files shown as edges
4. User can:
   - Click node to open that file
   - Hover to highlight connections
   - Zoom/pan to explore
   - Close graph panel with "Hide Graph" button

### Workflow 5: Search Documentation
1. User clicks search bar (or presses Ctrl+F)
2. User types search query
3. Results appear in real-time (debounced)
4. Results show:
   - Matching file names
   - Matching content with context
   - Line numbers
5. User clicks result to jump to file
6. Matched text is highlighted in file

### Workflow 6: Compare Multiple Documents
1. User has file A open
2. User right-clicks on file B in sidebar → "Open in New Pane"
3. Split view shows both files side-by-side
4. User can scroll each file independently
5. Resize divider between panes by dragging
6. Close a pane with X button

## Success Metrics

- **Performance:** File rendering < 500ms, search results < 300ms
- **Reliability:** 99.9% uptime for local server, zero data loss on connections
- **Usability:**
  - New users complete main workflows within 2 minutes
  - Users find search faster than manual file browsing
  - Graph visualization helps users understand file relationships
- **Scalability:** Application remains responsive with 500+ files
- **User Satisfaction:** Provides better reading experience than terminal/raw files

## Future Enhancements (V2+)

**User-Requested (Based on V1 Feedback):**
- Markdown editing directly in app
- Manual connection creation with types and metadata
- Advanced graph features (export, customization, metrics)
- Advanced search operators (filename:, before:, after:)
- Tagging and custom metadata per file

**Power User Features:**
- Frontmatter (YAML) parsing and display
- Bulk operations (move, copy, batch update links)
- Custom link rendering and graph styling
- Plugin system for custom renderers and exporters
- Browser extensions for viewing markdown files from other sources

**Collaboration & Sharing:**
- Export/import connections for backup or transfer
- Share read-only graphs with team members
- Multi-user editing (not initial focus)
- Sync with cloud storage (Drive, OneDrive)

**Integrations:**
- PDF export of files and graphs
- HTML export for static site generation
- Integration with CI/CD workflows
- Obsidian vault compatibility layer

## Error Handling & Edge Cases

### User-Facing Error States

| Scenario | User Experience |
|----------|-----------------|
| **No folder selected** | Welcome screen with "Select Folder" button; helpful message |
| **Permission denied** | "Error: Cannot access folder. Check permissions and try again." |
| **Empty folder** | "No markdown files found. Add .md files to get started." |
| **File cannot be read** | "Error: Could not read file. It may have been deleted or moved." |
| **Link points to deleted file** | Backlink shown but grayed out; click shows "File not found" message |
| **Very large file (>10MB)** | "File too large (exceeds 10MB limit). Consider splitting into smaller files." |
| **Invalid markdown** | File displays with best-effort rendering; no crash |
| **File deleted while viewing** | Toast notification: "This file was deleted. Returning to file list." |
| **Search index out of sync** | Auto-reindex; transparent to user (no visible lag) |
| **WebSocket disconnected** | Toast: "Connection lost. Reconnecting..." + automatic reconnect |

### Edge Cases Handled

- Files with special characters in names (encoded properly in URLs/paths)
- Files with identical names in different folders (shown with full paths)
- Circular backlinks (A→B→C→A) displayed without infinite loops
- Very long file names (truncated in UI with full name on hover)
- Files with YAML frontmatter (preserved, not parsed in v1)
- Markdown with embedded HTML (rendered safely with sanitization)
- Folders with 1000+ files (UI remains responsive with virtualization)
- Rapid file changes (debounced, no double-updates)
- User switches folders during use (confirmation dialog, clear cache)

## Competitive Differentiation

### Why Choose mdReader Over Alternatives?

| Feature | mdReader | Obsidian | VS Code | GitHub |
|---------|----------|----------|---------|--------|
| Works with any folder | ✅ Yes | ❌ Vault-locked | ✅ Yes | ✅ Yes |
| Zero setup friction | ✅ Point at folder | ❌ Vault creation | ✅ Minimal | ✅ Web only |
| Lightweight/fast | ✅ Node.js server | ❌ Electron (heavy) | ✅ Built-in | ✅ Cloud |
| Search across files | ✅ Full-text | ✅ Full-text | ✅ Yes | ✅ Yes |
| Beautiful markdown | ✅ Clean rendering | ✅ Yes | ✅ Yes | ✅ Yes |
| Graph visualization | ✅ Basic read-only | ✅ Advanced paid | ❌ No | ❌ No |
| Cost | ✅ Free/OSS | ❌ $0-$40/month | ✅ Free | ✅ Free |
| Git-friendly | ✅ No vendor lock-in | ❌ Vault .obsidian/ dir | ✅ Yes | ✅ Yes |
| Editing | ❌ Read-only (v1) | ✅ Full editor | ✅ Full editor | ✅ Yes |

**mdReader is best for:**
- Developers managing documentation in git repos
- Teams sharing markdown-based knowledge bases
- Fast reading and searching without bloat
- No learning curve (works like a browser)

**mdReader is NOT for:**
- Users who want markdown editing (use Obsidian or Typora)
- Note-taking with advanced tagging (use Obsidian)
- Offline-first sync across devices (use Obsidian)

## Constraints & Assumptions

**Constraints:**
- Application runs locally (not cloud-based)
- Only supports markdown files (.md)
- Read-only in v1 (editing deferred to v2+)
- Maximum file size 10MB
- Requires Node.js runtime

**Assumptions:**
- User has Node.js installed
- Markdown files are well-formed
- User has read/write access to markdown folder
- Relationships expressed via markdown links are sufficient for v1

## Timeline & Phasing (Revised - MVP First)

### V1 (MVP - Core Reading Experience)
- **Phase 1:** Project setup, file scanning, React layout, onboarding
- **Phase 2:** Beautiful markdown rendering (core value)
- **Phase 3:** Navigation (breadcrumbs, back/forward, TOC)
- **Phase 4:** Auto-detected backlinks display (zero friction relationship discovery)
- **Phase 5:** Full-text search (Phase 2 priority - essential for documentation)
- **Phase 6:** Split-pane view, real-time file sync
- **Phase 7:** Basic graph visualization (lightweight sidebar, read-only)
- **Phase 8:** Polish, optimization, error handling, documentation

### V2 (Advanced Features - After User Validation)
- Manual connection creation and management
- Connection types and metadata
- Advanced graph features (physics tuning, export, metrics)
- Advanced search operators
- Markdown frontmatter parsing
- Tagging and metadata systems
- Plugin system

## Acceptance Criteria - V1 MVP

The V1 release is complete when:

1. ✅ Onboarding: First-time user can select a folder in < 1 minute
2. ✅ File list displays all markdown files in selected folder
3. ✅ User can click file to view beautifully rendered markdown (not raw text)
   - Headers, lists, code blocks with syntax highlighting, tables, formatting all working
4. ✅ Navigation: Breadcrumb trail shows current location
5. ✅ Navigation: Back/forward buttons or Alt+Left/Alt+Right work
6. ✅ Navigation: Table of contents sidebar for long files
7. ✅ Backlinks: "Linked From" and "Links To" sections display automatically
   - No manual connection creation required
8. ✅ Backlinks: Clicking link navigates to other file
9. ✅ Search: Full-text search finds content across files
10. ✅ Search: Click result jumps to file with match highlighted
11. ✅ Split-pane: User can open 2 files side-by-side
12. ✅ Graph: Optional sidebar shows lightweight visualization of file relationships
13. ✅ Graph: Can click node to open file
14. ✅ Real-time: File changes detected and reflected in UI
15. ✅ Performance: Application responsive with 200+ files
16. ✅ Error handling: Graceful messages for permission errors, missing files, etc.
17. ✅ Documentation: README with setup and usage instructions

**NOT in V1 (deferred to V2):**
- Manual connection creation UI
- Connection metadata and types
- Graph export/customization
- Advanced search operators
- Frontmatter parsing

---

## Summary of Changes (Product Design Validation)

This PRD was reviewed and refined by the product design coach to focus on core value proposition and reduce scope creep. Key changes:

✅ **Narrowed Focus:** From "knowledge graph tool" to "beautiful markdown reader with navigation"
✅ **Simplified Connections:** Auto-detected backlinks (v1) instead of manual connection creation
✅ **Simplified Graph:** Lightweight read-only visualization instead of advanced features
✅ **Reprioritized Search:** Moved to Phase 2 (essential for documentation browsing)
✅ **Added Onboarding:** Welcome screen and first-time setup experience
✅ **Added Navigation:** Breadcrumbs, back/forward, table of contents
✅ **Added Error States:** Specific user experience for each error scenario
✅ **Deferred to V2:** Manual connections, physics tuning, graph export, advanced search
✅ **Clarified Target User:** Primary focus on developers managing documentation
✅ **Added Differentiation:** Clear positioning vs. Obsidian, VS Code, GitHub

**Result:** Focused MVP that ships faster with core value, enabling user feedback for v2+ features.

---

**Document Version:** 2.0 (Updated after product design review)
**Last Updated:** 2026-01-19
**Owner:** Development Team
