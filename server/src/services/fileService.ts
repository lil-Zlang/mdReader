import { glob } from "glob";
import { readFile, stat, writeFile, mkdir } from "fs/promises";
import { resolve, relative, basename, dirname } from "path";

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

export async function createFile(
  folderPath: string,
  fileName: string,
  content: string = "",
  subfolder: string = ""
): Promise<{ success: boolean; fileId: string; message?: string }> {
  try {
    // Sanitize filename
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "-");

    // Determine full path
    const targetDir = subfolder
      ? resolve(folderPath, subfolder)
      : folderPath;

    const filePath = resolve(targetDir, sanitizedFileName);

    // Security check: ensure path is within folderPath
    if (!filePath.startsWith(resolve(folderPath))) {
      throw new Error("Path traversal attempt detected");
    }

    // Create directory if it doesn't exist
    await mkdir(dirname(filePath), { recursive: true });

    // Write the file
    await writeFile(filePath, content, "utf-8");

    // Clear cache to force refresh
    clearCache();

    const fileId = relative(folderPath, filePath);

    return {
      success: true,
      fileId,
      message: `Created: ${fileId}`,
    };
  } catch (error) {
    console.error("Error creating file:", error);
    return {
      success: false,
      fileId: "",
      message: error instanceof Error ? error.message : "Failed to create file",
    };
  }
}

export async function updateFile(
  folderPath: string,
  fileId: string,
  content: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const filePath = resolve(folderPath, fileId);

    // Security check: ensure path is within folderPath
    if (!filePath.startsWith(resolve(folderPath))) {
      throw new Error("Path traversal attempt detected");
    }

    // Write the updated content
    await writeFile(filePath, content, "utf-8");

    // Clear cache to force refresh
    clearCache();

    return {
      success: true,
      message: `Updated: ${fileId}`,
    };
  } catch (error) {
    console.error("Error updating file:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to update file",
    };
  }
}
