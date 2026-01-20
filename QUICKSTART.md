# mdReader - Quick Start Guide

Get started with mdReader in 5 minutes!

## Installation

```bash
cd /Users/langgui/project/mdReader

# Install dependencies
npm install --legacy-peer-deps
```

## Start the Application

Open two terminal windows:

**Terminal 1 - Backend Server:**
```bash
npm run server
```

You should see:
```
Server running on http://localhost:3001
```

**Terminal 2 - Frontend App:**
```bash
npm run client
```

You should see:
```
Local: http://localhost:5173
```

## First Launch

1. Open http://localhost:5173 in your browser
2. You'll see the welcome screen
3. Click "Select Folder" or enter the path to a folder with markdown files
4. Example path: `/tmp/mdreader_test`

## Try It Out

### Create Test Files

Create some markdown files to test:

```bash
mkdir -p ~/test-docs

cat > ~/test-docs/README.md << 'EOF'
# Welcome

This is a test document. See [guide.md](guide.md) for more.
EOF

cat > ~/test-docs/guide.md << 'EOF'
# Guide

# Section 1
Content here.

# Section 2
More content.

See [README.md](README.md).
EOF
```

### Test Features

1. **Browse**: Click files in the sidebar
2. **Search**: Press `Ctrl+F` and search for a word
3. **Navigate**: Press `Alt+Left` to go back
4. **Links**: Click "Show Links" to see connections
5. **TOC**: Click "Show TOC" to see headings
6. **Real-time**: Add a new .md file while app is running - it appears automatically!

## Keyboard Shortcuts

- `Ctrl+F` - Open search
- `Alt+←` - Back
- `Alt+→` - Forward
- `Ctrl+T` - Toggle Table of Contents
- `Esc` - Close dialogs

## Troubleshooting

### Port Already in Use

If port 3001 or 5173 is in use:

```bash
# Edit server/.env
PORT=3002

# Edit client/vite.config.ts and change port to 5174
```

### Module Not Found

```bash
npm install --legacy-peer-deps
npm install
```

### Files Not Loading

1. Ensure folder contains `.md` files
2. Check folder permissions
3. Restart both server and client

## Next Steps

- Read the full [README.md](README.md)
- Check out example markdown files in `/tmp/mdreader_test`
- Explore the features with your own markdown documentation

## File Structure

```
mdReader/
├── client/          # React app (runs on 5173)
├── server/          # API server (runs on 3001)
├── shared/          # TypeScript types
└── README.md        # Full documentation
```

## Support

- Check the README.md for full documentation
- Review error messages in browser console (F12)
- Check server logs in terminal for API errors

Enjoy reading markdown beautifully! 📖✨
