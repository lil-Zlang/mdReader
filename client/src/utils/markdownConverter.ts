import { marked } from "marked";
import TurndownService from "turndown";

// Configure marked for HTML generation
marked.setOptions({
  gfm: true,
  breaks: true,
});

// Create turndown service for HTML to Markdown conversion
const turndownService = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
  emDelimiter: "*",
  strongDelimiter: "**",
});

// Add strikethrough support
turndownService.addRule("strikethrough", {
  filter: ["del", "s"] as const,
  replacement: function (content) {
    return "~~" + content + "~~";
  },
});

// Add horizontal rule support
turndownService.addRule("horizontalRule", {
  filter: "hr",
  replacement: function () {
    return "\n\n---\n\n";
  },
});

// Add code block support for pre elements
turndownService.addRule("codeBlock", {
  filter: function (node) {
    return (
      node.nodeName === "PRE" &&
      node.firstChild !== null &&
      node.firstChild.nodeName === "CODE"
    );
  },
  replacement: function (content, node) {
    const codeNode = node.firstChild as HTMLElement;
    const language = codeNode.className?.replace("language-", "") || "";
    const code = codeNode.textContent || "";
    return "\n\n```" + language + "\n" + code + "\n```\n\n";
  },
});

// Keep inline code as-is
turndownService.addRule("inlineCode", {
  filter: function (node) {
    return node.nodeName === "CODE" && node.parentNode?.nodeName !== "PRE";
  },
  replacement: function (content) {
    return "`" + content + "`";
  },
});

/**
 * Convert markdown to HTML for loading into TipTap editor
 */
export function markdownToHtml(md: string): string {
  try {
    // Convert markdown to HTML
    const html = marked.parse(md) as string;
    return html;
  } catch (error) {
    console.error("Error converting markdown to HTML:", error);
    return `<p>${md}</p>`;
  }
}

/**
 * Convert HTML from TipTap editor to markdown for saving
 */
export function htmlToMarkdown(html: string): string {
  try {
    // Convert HTML to markdown
    const markdown = turndownService.turndown(html);
    return markdown;
  } catch (error) {
    console.error("Error converting HTML to markdown:", error);
    return html;
  }
}

/**
 * Count words in text content
 */
export function countWords(text: string): number {
  const cleanText = text
    .replace(/<[^>]*>/g, " ") // Remove HTML tags
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();

  if (!cleanText) return 0;

  return cleanText.split(/\s+/).length;
}
