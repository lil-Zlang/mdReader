# mdr (CLI-only)

A lightweight CLI that serves a local, browser-based markdown reader with inline (Notion-style) editing and table of contents.

## Setup

```bash
npm install
npm link
```

## Usage

```bash
# Open current directory
mdr

# Open a folder
mdr ./docs

# Open a specific file
mdr /Users/you/notes.md

# Choose a port
mdr ./docs --port 8080

# Don't auto-open the browser
mdr ./docs --no-open
```

The CLI starts a local server and opens a browser at `http://localhost:<port>`.
