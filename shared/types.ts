// File and Metadata types
export interface MarkdownFile {
  id: string; // Relative path from markdown root
  name: string; // Filename
  path: string; // Full absolute path
  relativePath: string; // Relative path for display
  content?: string; // Markdown content (loaded on demand)
  metadata: FileMetadata;
}

export interface FileMetadata {
  size: number; // File size in bytes
  modifiedAt: Date; // Last modified timestamp
  createdAt: Date; // Created timestamp
  hash?: string; // SHA256 hash for change detection
}

// Auto-detected backlinks
export interface BacklinkInfo {
  linkedFrom: BacklinkReference[]; // Files that link to current file
  linksTo: BacklinkReference[]; // Files current file links to
}

export interface BacklinkReference {
  fileId: string; // ID of the linked file
  fileName: string; // Name for display
  linkText: string; // Text of the link in markdown
  lineNumber?: number; // Line number where link appears
  context?: string; // Surrounding text for context
}

// Graph data (read-only in v1)
export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface GraphNode {
  id: string; // File ID
  label: string; // File name
  type: "file";
}

export interface GraphEdge {
  id: string; // Unique edge ID
  source: string; // Source file ID
  target: string; // Target file ID
  label?: string; // Link text
}

// Search results
export interface SearchResult {
  fileId: string;
  fileName: string;
  matches: SearchMatch[];
  score: number; // Relevance score
}

export interface SearchMatch {
  lineNumber: number;
  lineContent: string; // The matching line
  context: string; // Surrounding lines
  matchStart: number; // Start index of match in line
  matchEnd: number; // End index of match in line
}

// Navigation history
export interface NavigationHistoryItem {
  fileId: string;
  scrollPosition: number;
  timestamp: Date;
}

// Configuration
export interface AppConfig {
  markdownFolderPath: string;
  recentFolders?: string[];
}
