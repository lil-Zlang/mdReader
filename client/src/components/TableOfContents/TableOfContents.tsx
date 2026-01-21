import { useEffect, useState } from "react";
import { slugify, createUniqueSlug } from "../../utils/slugify";
import styles from "./TableOfContents.module.css";

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
  onHeadingClick?: (headingId: string) => void;
  onScroll?: (headingId: string) => void;
}

// Strip markdown formatting from text to get plain text
const stripMarkdown = (text: string): string => {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // [link](url) -> link
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1') // ![alt](url) -> alt
    .replace(/`([^`]+)`/g, '$1')              // `code` -> code
    .replace(/\*\*([^*]+)\*\*/g, '$1')        // **bold** -> bold
    .replace(/\*([^*]+)\*/g, '$1')            // *italic* -> italic
    .replace(/__([^_]+)__/g, '$1')            // __bold__ -> bold
    .replace(/_([^_]+)_/g, '$1')              // _italic_ -> italic
    .replace(/~~([^~]+)~~/g, '$1')            // ~~strike~~ -> strike
    .trim();
};

export default function TableOfContents({
  content,
  onHeadingClick,
  onScroll,
}: TableOfContentsProps) {
  const [headings, setHeadings] = useState<Heading[]>([]);

  useEffect(() => {
    // Extract headings from markdown content, skipping code blocks
    const lines = content.split("\n");
    const extractedHeadings: Heading[] = [];
    const usedSlugs = new Set<string>();
    let inCodeBlock = false;

    lines.forEach((line) => {
      // Track code block state (``` or ~~~)
      if (line.trim().startsWith("```") || line.trim().startsWith("~~~")) {
        inCodeBlock = !inCodeBlock;
        return;
      }

      // Skip lines inside code blocks
      if (inCodeBlock) return;

      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const rawText = match[2].trim();
        // Strip markdown formatting for slug generation (to match MarkdownViewer)
        const plainText = stripMarkdown(rawText);
        const id = createUniqueSlug(plainText, usedSlugs);
        usedSlugs.add(id);

        // Use plain text for cleaner display
        extractedHeadings.push({ id, text: plainText, level });
      }
    });

    setHeadings(extractedHeadings);
  }, [content]);

  if (headings.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>No headings found</div>
      </div>
    );
  }

  return (
    <nav className={styles.container}>
      <div className={styles.header}>Table of Contents</div>
      <ul className={styles.list}>
        {headings.map((heading) => (
          <li
            key={heading.id}
            className={styles.item}
            style={{ marginLeft: `${(heading.level - 1)}rem` }}
          >
            <a
              className={styles.link}
              onClick={() => onScroll?.(heading.id)}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
