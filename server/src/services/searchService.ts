import Fuse from "fuse.js";
import { scanMarkdownFiles, getFileContent } from "./fileService.js";

interface IndexedFile {
  id: string;
  name: string;
  content: string;
}

interface SearchResult {
  fileId: string;
  fileName: string;
  matches: Array<{
    lineNumber: number;
    lineContent: string;
    context: string;
  }>;
  score: number;
}

let searchIndex: Fuse<IndexedFile> | null = null;
let indexedFiles: IndexedFile[] = [];
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function buildSearchIndex(
  folderPath: string
): Promise<Fuse<IndexedFile>> {
  const now = Date.now();

  // Return cached index if recent
  if (searchIndex && now - cacheTimestamp < CACHE_DURATION) {
    return searchIndex;
  }

  try {
    const files = await scanMarkdownFiles(folderPath);
    indexedFiles = [];

    for (const file of files) {
      const content = await getFileContent(folderPath, file.id);
      if (content) {
        indexedFiles.push({
          id: file.id,
          name: file.name,
          content: content.content,
        });
      }
    }

    searchIndex = new Fuse(indexedFiles, {
      keys: [
        { name: "name", weight: 3 }, // File name has higher weight
        { name: "content", weight: 1 },
      ],
      threshold: 0.3,
      useExtendedSearch: true,
      includeScore: true,
      minMatchCharLength: 2,
    });

    cacheTimestamp = now;
    return searchIndex;
  } catch (error) {
    console.error("Error building search index:", error);
    if (searchIndex) {
      return searchIndex;
    }
    throw error;
  }
}

export async function search(
  folderPath: string,
  query: string,
  limit: number = 50
): Promise<SearchResult[]> {
  if (!query.trim()) {
    return [];
  }

  try {
    const index = await buildSearchIndex(folderPath);
    const results = index.search(query, { limit });

    const searchResults: SearchResult[] = results.map((result) => {
      const file = result.item;
      const lines = file.content.split("\n");
      const matches: SearchResult["matches"] = [];

      // Find matching lines
      const searchLower = query.toLowerCase();
      lines.forEach((line, lineIndex) => {
        if (line.toLowerCase().includes(searchLower)) {
          matches.push({
            lineNumber: lineIndex + 1,
            lineContent: line.trim(),
            context: getContext(lines, lineIndex),
          });
        }
      });

      return {
        fileId: file.id,
        fileName: file.name,
        matches: matches.slice(0, 5), // Show max 5 matches per file
        score: result.score || 0,
      };
    });

    return searchResults;
  } catch (error) {
    console.error("Error searching:", error);
    return [];
  }
}

function getContext(lines: string[], lineIndex: number, contextLines: number = 1): string {
  const start = Math.max(0, lineIndex - contextLines);
  const end = Math.min(lines.length, lineIndex + contextLines + 1);
  return lines.slice(start, end).join("\n").trim();
}

export function clearSearchCache() {
  searchIndex = null;
  indexedFiles = [];
}
