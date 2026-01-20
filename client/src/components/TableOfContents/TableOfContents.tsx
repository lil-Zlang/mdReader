import { useEffect, useState } from "react";
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
    let headingIndex = 0;
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
        const text = match[2].trim();
        // Use sequential index to match MarkdownViewer's data-heading-id
        const id = `heading-${headingIndex}`;
        headingIndex++;

        extractedHeadings.push({ id, text, level });
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
