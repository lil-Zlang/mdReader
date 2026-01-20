import { getFileContent, scanMarkdownFiles } from "./fileService.js";

interface BacklinkData {
  from: string; // File ID that contains the link
  to: string; // File ID being linked to
  text: string; // Link text
  lineNumber: number;
  context: string;
}

let backlinkCache: Map<string, BacklinkData[]> = new Map();
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function buildBacklinkIndex(
  folderPath: string
): Promise<Map<string, BacklinkData[]>> {
  const now = Date.now();

  // Return cached results if recent
  if (backlinkCache.size > 0 && now - cacheTimestamp < CACHE_DURATION) {
    return backlinkCache;
  }

  backlinkCache.clear();

  try {
    const files = await scanMarkdownFiles(folderPath);

    // Parse all files for links
    for (const file of files) {
      const content = await getFileContent(folderPath, file.id);
      if (!content) continue;

      const links = extractLinksFromMarkdown(content.content);

      for (const link of links) {
        // Try to match the link target to a file
        const targetFileId = findFileByLink(link.target, files, file.id);
        if (targetFileId) {
          if (!backlinkCache.has(targetFileId)) {
            backlinkCache.set(targetFileId, []);
          }

          backlinkCache.get(targetFileId)!.push({
            from: file.id,
            to: targetFileId,
            text: link.text,
            lineNumber: link.lineNumber,
            context: link.context,
          });
        }
      }
    }

    cacheTimestamp = now;
    return backlinkCache;
  } catch (error) {
    console.error("Error building backlink index:", error);
    return backlinkCache;
  }
}

interface ExtractedLink {
  target: string;
  text: string;
  lineNumber: number;
  context: string;
}

function extractLinksFromMarkdown(content: string): ExtractedLink[] {
  const links: ExtractedLink[] = [];
  const lines = content.split("\n");

  // Regex patterns for different link formats
  // [text](target) - standard markdown
  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  // [[target]] or [[target|display]] - wiki-style
  const wikiLinkRegex = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

  lines.forEach((line, lineIndex) => {
    // Extract markdown-style links: [text](file.md)
    let match;
    while ((match = markdownLinkRegex.exec(line)) !== null) {
      const text = match[1];
      const target = match[2];

      // Only include markdown files
      if (
        target.endsWith(".md") ||
        target.includes(".md#") ||
        !target.includes("://")
      ) {
        links.push({
          target: target.split("#")[0], // Remove anchor
          text,
          lineNumber: lineIndex + 1,
          context: line.trim(),
        });
      }
    }

    // Extract wiki-style links: [[file]] or [[file|text]]
    wikiLinkRegex.lastIndex = 0;
    while ((match = wikiLinkRegex.exec(line)) !== null) {
      const target = match[1].trim();
      const text = match[2] || target;

      links.push({
        target: `${target}.md`,
        text,
        lineNumber: lineIndex + 1,
        context: line.trim(),
      });
    }
  });

  return links;
}

interface MarkdownFile {
  id: string;
  name: string;
  relativePath: string;
}

function findFileByLink(
  linkTarget: string,
  files: MarkdownFile[],
  fromFileId: string
): string | null {
  // If it's already a full path with extension
  if (linkTarget.endsWith(".md")) {
    // Try exact match first
    const exact = files.find((f) => f.id === linkTarget);
    if (exact) return exact.id;

    // Try filename only match
    const fileName = linkTarget.split("/").pop();
    const byName = files.find((f) => f.name === fileName);
    if (byName) return byName.id;

    // Try relative path from current file
    const currentDir = fromFileId.substring(0, fromFileId.lastIndexOf("/"));
    const resolved = currentDir
      ? `${currentDir}/${linkTarget}`
      : linkTarget;
    const byResolved = files.find((f) => f.id === resolved);
    if (byResolved) return byResolved.id;
  } else {
    // Try adding .md extension
    return findFileByLink(`${linkTarget}.md`, files, fromFileId);
  }

  return null;
}

export async function getBacklinks(
  folderPath: string,
  fileId: string
): Promise<{
  linkedFrom: Array<{ fileId: string; fileName: string; context: string }>;
  linksTo: Array<{ fileId: string; fileName: string; context: string }>;
}> {
  const index = await buildBacklinkIndex(folderPath);
  const files = await scanMarkdownFiles(folderPath);
  const fileMap = new Map(files.map((f) => [f.id, f]));

  const linkedFrom: Array<{ fileId: string; fileName: string; context: string }> =
    [];
  const linksTo: Array<{ fileId: string; fileName: string; context: string }> = [];

  // Files that link TO this file
  if (index.has(fileId)) {
    const backlinks = index.get(fileId)!;
    for (const link of backlinks) {
      const file = fileMap.get(link.from);
      if (file) {
        linkedFrom.push({
          fileId: link.from,
          fileName: file.name,
          context: link.context,
        });
      }
    }
  }

  // Files that THIS file links TO
  for (const [targetFileId, links] of index.entries()) {
    for (const link of links) {
      if (link.from === fileId) {
        const file = fileMap.get(targetFileId);
        if (file) {
          linksTo.push({
            fileId: targetFileId,
            fileName: file.name,
            context: link.context,
          });
        }
      }
    }
  }

  // Remove duplicates
  const uniqueLinkedFrom = Array.from(
    new Map(linkedFrom.map((x) => [x.fileId, x])).values()
  );
  const uniqueLinksTo = Array.from(
    new Map(linksTo.map((x) => [x.fileId, x])).values()
  );

  return {
    linkedFrom: uniqueLinkedFrom,
    linksTo: uniqueLinksTo,
  };
}

export function clearBacklinkCache() {
  backlinkCache.clear();
}
