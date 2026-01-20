import { glob } from "glob";
import { readFile, stat } from "fs/promises";
import { resolve, relative, basename } from "path";

export interface CachedFile {
  id: string;
  name: string;
  path: string;
  relativePath: string;
  metadata: {
    size: number;
    modifiedAt: Date;
    createdAt: Date;
  };
}

let fileCache: Map<string, CachedFile> = new Map();
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function scanMarkdownFiles(
  folderPath: string
): Promise<CachedFile[]> {
  const now = Date.now();

  // Return cached results if recent
  if (fileCache.size > 0 && now - cacheTimestamp < CACHE_DURATION) {
    return Array.from(fileCache.values());
  }

  try {
    const pattern = resolve(folderPath, "**/*.md");
    const files = await glob(pattern, {
      ignore: ["**/node_modules/**"],
    });

    fileCache.clear();

    for (const filePath of files) {
      const stats = await stat(filePath);
      const relativePath = relative(folderPath, filePath);
      const fileName = basename(filePath);

      const cachedFile: CachedFile = {
        id: relativePath,
        name: fileName,
        path: filePath,
        relativePath,
        metadata: {
          size: stats.size,
          modifiedAt: stats.mtime,
          createdAt: stats.birthtime,
        },
      };

      fileCache.set(relativePath, cachedFile);
    }

    cacheTimestamp = now;
    return Array.from(fileCache.values());
  } catch (error) {
    console.error("Error scanning markdown files:", error);
    return Array.from(fileCache.values());
  }
}

export async function getFileContent(
  folderPath: string,
  fileId: string
): Promise<{ content: string; metadata: CachedFile["metadata"] } | null> {
  try {
    const filePath = resolve(folderPath, fileId);

    // Security check: ensure path is within folderPath
    if (!filePath.startsWith(resolve(folderPath))) {
      throw new Error("Path traversal attempt detected");
    }

    const content = await readFile(filePath, "utf-8");
    const stats = await stat(filePath);

    return {
      content,
      metadata: {
        size: stats.size,
        modifiedAt: stats.mtime,
        createdAt: stats.birthtime,
      },
    };
  } catch (error) {
    console.error("Error reading file:", error);
    return null;
  }
}

export function clearCache() {
  fileCache.clear();
}
