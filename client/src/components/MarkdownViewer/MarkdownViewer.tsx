import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { useEffect, useState, useRef } from "react";
import styles from "./MarkdownViewer.module.css";

interface MarkdownViewerProps {
  fileId: string;
  fileName: string;
  scrollToHeading?: string;
}

export default function MarkdownViewer({
  fileId,
  fileName,
  scrollToHeading,
}: MarkdownViewerProps) {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchFile = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/files/${fileId}`);
        if (!response.ok) {
          throw new Error("Failed to load file");
        }
        const data = await response.json();
        setContent(data.content);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setContent("");
      } finally {
        setLoading(false);
      }
    };

    fetchFile();
  }, [fileId]);

  // Scroll to heading when requested
  useEffect(() => {
    if (scrollToHeading && containerRef.current) {
      // Try to find by data-heading-id first
      let element = containerRef.current.querySelector(
        `[data-heading-id="${scrollToHeading}"]`
      );

      // If not found, try to find by heading number in content
      if (!element) {
        const headingNumber = scrollToHeading.replace("heading-", "");
        const headings = containerRef.current.querySelectorAll("h1, h2, h3, h4, h5, h6");
        element = headings[parseInt(headingNumber, 10)];
      }

      if (element) {
        setTimeout(() => {
          element!.scrollIntoView({ behavior: "smooth", block: "start" });
          // Highlight the heading briefly
          element!.classList.add(styles.highlighted);
          setTimeout(() => {
            element!.classList.remove(styles.highlighted);
          }, 2000);
        }, 100);
      }
    }
  }, [scrollToHeading]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Error: {error}</div>
      </div>
    );
  }

  let headingIndex = 0;

  return (
    <div className={styles.container} ref={containerRef}>
      <div className={styles.header}>
        <h1 className={styles.title}>{fileName}</h1>
      </div>
      <div className={styles.content}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
          components={{
            img: ({ node, ...props }) => (
              <img {...props} className={styles.image} />
            ),
            table: ({ node, ...props }) => (
              <table {...props} className={styles.table} />
            ),
            code: ({ node, inline, ...props }: any) => {
              return inline ? (
                <code {...props} className={styles.inlineCode} />
              ) : (
                <code {...props} className={styles.codeBlock} />
              );
            },
            h1: ({ children, ...props }) => (
              <h1 {...props} data-heading-id={`heading-${headingIndex++}`}>
                {children}
              </h1>
            ),
            h2: ({ children, ...props }) => (
              <h2 {...props} data-heading-id={`heading-${headingIndex++}`}>
                {children}
              </h2>
            ),
            h3: ({ children, ...props }) => (
              <h3 {...props} data-heading-id={`heading-${headingIndex++}`}>
                {children}
              </h3>
            ),
            h4: ({ children, ...props }) => (
              <h4 {...props} data-heading-id={`heading-${headingIndex++}`}>
                {children}
              </h4>
            ),
            h5: ({ children, ...props }) => (
              <h5 {...props} data-heading-id={`heading-${headingIndex++}`}>
                {children}
              </h5>
            ),
            h6: ({ children, ...props }) => (
              <h6 {...props} data-heading-id={`heading-${headingIndex++}`}>
                {children}
              </h6>
            ),
            a: ({ node, href, ...props }) => {
              // Handle internal links
              if (href && (href.endsWith(".md") || href.startsWith("[["))){
                return <a {...props} href={href} className={styles.internalLink} />;
              }
              return <a {...props} href={href} />;
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
