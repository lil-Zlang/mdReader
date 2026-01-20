import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { useEffect, useState, useRef } from "react";
import styles from "./MarkdownViewer.module.css";

interface MarkdownViewerProps {
  fileId: string;
  fileName: string;
  scrollToHeading?: string;
  scrollKey?: number; // Timestamp to force re-scroll even to same heading
}

export default function MarkdownViewer({
  fileId,
  fileName,
  scrollToHeading,
  scrollKey,
}: MarkdownViewerProps) {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editContent, setEditContent] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const headingIndexRef = useRef(0);

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
        setEditContent(data.content);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setContent("");
      } finally {
        setLoading(false);
      }
    };

    fetchFile();
    setIsEditMode(false); // Reset edit mode when switching files
  }, [fileId]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      alert("Failed to copy to clipboard");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      });

      if (!response.ok) {
        throw new Error("Failed to save file");
      }

      setContent(editContent);
      setIsEditMode(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save file");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditContent(content);
    setIsEditMode(false);
  };

  // Scroll to heading when requested
  useEffect(() => {
    if (scrollToHeading && containerRef.current && !loading) {
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
  }, [scrollToHeading, scrollKey, loading]);

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

  // Reset counter before each render
  headingIndexRef.current = 0;

  const getNextHeadingId = () => {
    const id = `heading-${headingIndexRef.current}`;
    headingIndexRef.current++;
    return id;
  };

  return (
    <div className={styles.container} ref={containerRef}>
      <div className={styles.header}>
        <h1 className={styles.title}>{fileName}</h1>
        <div className={styles.actions}>
          <button
            className={styles.actionButton}
            onClick={handleCopy}
            title="Copy to clipboard"
          >
            {copied ? "✓ Copied" : "📋 Copy"}
          </button>
          {!isEditMode ? (
            <button
              className={styles.actionButton}
              onClick={() => setIsEditMode(true)}
              title="Edit file"
            >
              ✏️ Edit
            </button>
          ) : (
            <>
              <button
                className={styles.saveButton}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving..." : "💾 Save"}
              </button>
              <button
                className={styles.cancelButton}
                onClick={handleCancelEdit}
                disabled={saving}
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
      <div className={styles.content}>
        {isEditMode ? (
          <textarea
            className={styles.editor}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            placeholder="Write your markdown here..."
          />
        ) : (
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
              <h1 {...props} data-heading-id={getNextHeadingId()}>
                {children}
              </h1>
            ),
            h2: ({ children, ...props }) => (
              <h2 {...props} data-heading-id={getNextHeadingId()}>
                {children}
              </h2>
            ),
            h3: ({ children, ...props }) => (
              <h3 {...props} data-heading-id={getNextHeadingId()}>
                {children}
              </h3>
            ),
            h4: ({ children, ...props }) => (
              <h4 {...props} data-heading-id={getNextHeadingId()}>
                {children}
              </h4>
            ),
            h5: ({ children, ...props }) => (
              <h5 {...props} data-heading-id={getNextHeadingId()}>
                {children}
              </h5>
            ),
            h6: ({ children, ...props }) => (
              <h6 {...props} data-heading-id={getNextHeadingId()}>
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
        )}
      </div>
    </div>
  );
}
