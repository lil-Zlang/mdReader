import type { VercelRequest, VercelResponse } from '@vercel/node';

const demoContent: Record<string, string> = {
  'welcome.md': `# Welcome to mdReader

mdReader is a beautiful markdown reader and editor designed for your local documents.

## About This Demo

This is a **demo deployment** on Vercel. In this mode, you can explore the interface but file changes won't persist.

To use mdReader with your own files, run it locally:

\`\`\`bash
git clone https://github.com/lil-Zlang/mdReader.git
cd mdReader
npm install
npm run dev
\`\`\`

Then open your browser to \`http://localhost:3000\` and point it to your markdown folder.

## Features

- 📖 Beautiful reading experience
- ✏️ WYSIWYG editing with rich text
- 🔍 Fast search across all files
- 📑 Table of Contents navigation
- 🌙 Clean, distraction-free design
`,
  'getting-started.md': `# Getting Started

## Installation

1. Clone the repository
2. Install dependencies with \`npm install\`
3. Run the development server with \`npm run dev\`

## Configuration

mdReader reads markdown files from a specified folder. When running locally, you'll be prompted to select your documents folder.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| \`Cmd+F\` | Open search |
| \`Cmd+N\` | New entry |
| \`Cmd+T\` | Toggle TOC |
| \`Alt+←\` | Go back |
| \`Alt+→\` | Go forward |

## File Organization

You can organize your markdown files in folders. mdReader will scan all \`.md\` files recursively.

\`\`\`
documents/
├── notes/
│   ├── meeting-notes.md
│   └── ideas.md
├── projects/
│   └── project-plan.md
└── README.md
\`\`\`
`,
  'features.md': `# Features

## Reading Experience

mdReader provides a clean, distraction-free reading experience inspired by the best documentation sites.

### Syntax Highlighting

Code blocks are automatically highlighted:

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet('World'));
\`\`\`

### Tables

| Feature | Status |
|---------|--------|
| Markdown rendering | ✅ |
| WYSIWYG editing | ✅ |
| File search | ✅ |
| TOC navigation | ✅ |
| Fullscreen mode | ✅ |

## Editing

Click the **Edit** button to switch to the rich text editor. Features include:

- Bold, italic, underline formatting
- Headings (H1-H6)
- Bullet and numbered lists
- Code blocks with syntax highlighting
- Links and images
- Tables

## Search

Press \`Cmd+F\` to open the search dialog. Search across all your markdown files instantly.

> **Tip:** Use quotes for exact phrase matching: \`"exact phrase"\`

## Customization

### Wide Mode

Toggle wide mode in edit view to use the full width of your screen.

### Fullscreen

Enter fullscreen mode for distraction-free writing. Press \`Esc\` to exit.
`,
};

export default function handler(req: VercelRequest, res: VercelResponse) {
  const { fileId } = req.query;
  const id = Array.isArray(fileId) ? fileId[0] : fileId;

  if (!id) {
    return res.status(400).json({ error: 'Missing fileId' });
  }

  if (req.method === 'GET') {
    const content = demoContent[id];
    if (!content) {
      return res.status(404).json({ error: 'File not found' });
    }
    return res.json({
      content,
      metadata: {
        size: content.length,
        modifiedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      },
    });
  }

  if (req.method === 'PUT') {
    // In demo mode, pretend to update
    return res.json({
      success: true,
      message: 'Demo mode: File update simulated (changes not persisted)',
    });
  }

  if (req.method === 'DELETE') {
    // In demo mode, pretend to delete
    return res.json({
      success: true,
      message: 'Demo mode: File deletion simulated',
    });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
