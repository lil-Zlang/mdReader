import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { useEffect, useState, useRef } from "react";
import { RichTextEditor } from "../RichTextEditor";
import { htmlToMarkdown } from "../../utils/markdownConverter";
import { slugify, createUniqueSlug } from "../../utils/slugify";
import styles from "./MarkdownViewer.module.css";

interface MarkdownViewerProps {
  fileId: string;
  fileName: string;
  scrollToHeading?: string;
  scrollKey?: number; // Timestamp to force re-scroll even to same heading
  showTOC?: boolean;
  onToggleTOC?: () => void;
  initialContent?: string; // Content passed from parent for sync with TOC
  onContentChange?: (content: string) => void; // Notify parent when content changes
}

export default function MarkdownViewer({
  fileId,
  fileName,
  scrollToHeading,
  scrollKey,
  showTOC,
  onToggleTOC,
  initialContent,
  onContentChange,
}: MarkdownViewerProps) {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isWideMode, setIsWideMode] = useState(false);
  const [editContent, setEditContent] = useState<string>("");
  const [editorHtml, setEditorHtml] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const usedSlugsRef = useRef<Set<string>>(new Set());

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
        // Notify parent of content for TOC synchronization
        onContentChange?.(data.content);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setContent("");
      } finally {
        setLoading(false);
      }
    };

    // Use initialContent if provided, otherwise fetch
    if (initialContent !== undefined) {
      setContent(initialContent);
      setEditContent(initialContent);
      setLoading(false);
      setError(null);
    } else {
      fetchFile();
    }
    setIsEditMode(false); // Reset edit mode when switching files
    setIsFullscreen(false); // Reset fullscreen when switching files
  }, [fileId, initialContent, onContentChange]);

  // ESC key handler for fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    if (isFullscreen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isFullscreen]);

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
      // Convert HTML from rich text editor to markdown
      const markdownContent = htmlToMarkdown(editorHtml);

      const response = await fetch(`/api/files/${fileId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: markdownContent }),
      });

      if (!response.ok) {
        throw new Error("Failed to save file");
      }

      setContent(markdownContent);
      setEditContent(markdownContent);
      setIsEditMode(false);
      setIsFullscreen(false);
      // Notify parent to keep TOC in sync
      onContentChange?.(markdownContent);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save file");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditContent(content);
    setIsEditMode(false);
    setIsFullscreen(false);
  };

  // Scroll to heading when requested
  useEffect(() => {
    if (scrollToHeading && containerRef.current && !loading) {
      // Small delay to ensure DOM is fully rendered
      const scrollTimeout = setTimeout(() => {
        const container = containerRef.current;
        if (!container) return;

        // Try multiple ways to find the element within the container
        let element: HTMLElement | null = null;

        // Method 1: Try querySelector within container
        try {
          element = container.querySelector(`#${CSS.escape(scrollToHeading)}`) as HTMLElement;
        } catch {
          // Ignore selector errors
        }

        // Method 2: Try direct getElementById as fallback
        if (!element) {
          element = document.getElementById(scrollToHeading);
        }

        // Method 3: Try attribute selector
        if (!element) {
          try {
            element = container.querySelector(`[id="${scrollToHeading}"]`) as HTMLElement;
          } catch {
            // Ignore selector errors
          }
        }

        if (element) {
          // Calculate scroll position accounting for sticky header
          const headerHeight = 80; // Approximate header height
          const elementTop = element.offsetTop;
          const scrollPosition = elementTop - headerHeight;

          // Scroll the container directly
          container.scrollTo({
            top: scrollPosition,
            behavior: 'smooth'
          });

          // Highlight the heading briefly
          element.classList.add(styles.highlighted);
          setTimeout(() => {
            element?.classList.remove(styles.highlighted);
          }, 2000);
        } else {
          console.warn('TOC: Could not find heading with id:', scrollToHeading);
          // Debug: list all heading IDs in the container
          const allHeadings = container.querySelectorAll('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]');
          console.log('Available heading IDs:', Array.from(allHeadings).map(h => h.id));
        }
      }, 150);

      return () => clearTimeout(scrollTimeout);
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

  // Reset slug tracker before each render
  usedSlugsRef.current = new Set();

  // Recursively extract text from React children
  const extractText = (node: React.ReactNode): string => {
    if (typeof node === 'string') {
      return node;
    }
    if (typeof node === 'number') {
      return String(node);
    }
    if (Array.isArray(node)) {
      return node.map(extractText).join('');
    }
    if (node && typeof node === 'object' && 'props' in node) {
      // React element - extract from children
      return extractText((node as React.ReactElement).props.children);
    }
    return '';
  };

  const getHeadingId = (children: React.ReactNode): string => {
    const text = extractText(children);
    const id = createUniqueSlug(text, usedSlugsRef.current);
    usedSlugsRef.current.add(id);
    return id;
  };

  return (
    <div className={`${styles.container} ${isFullscreen ? styles.fullscreen : ''}`} ref={containerRef}>
      <div className={styles.header}>
        {!isFullscreen && <h1 className={styles.title}>{fileName}</h1>}
        {isFullscreen && (
          <span className={styles.fullscreenTitle}>Editing: {fileName}</span>
        )}
        <div className={styles.actions}>
          {!isEditMode && (
            <button
              className={styles.actionButton}
              onClick={handleCopy}
              title="Copy to clipboard"
            >
              {copied ? "✓ Copied" : "📋 Copy"}
            </button>
          )}
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
              {/* Edit mode toggle controls */}
              <div className={styles.editToggles}>
                {!isFullscreen && onToggleTOC && (
                  <button
                    className={`${styles.toggleButton} ${showTOC ? styles.active : ''}`}
                    onClick={onToggleTOC}
                    title={showTOC ? "Hide outline" : "Show outline"}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="8" y1="6" x2="21" y2="6" />
                      <line x1="8" y1="12" x2="21" y2="12" />
                      <line x1="8" y1="18" x2="21" y2="18" />
                      <line x1="3" y1="6" x2="3.01" y2="6" />
                      <line x1="3" y1="12" x2="3.01" y2="12" />
                      <line x1="3" y1="18" x2="3.01" y2="18" />
                    </svg>
                  </button>
                )}
                <button
                  className={`${styles.toggleButton} ${isWideMode ? styles.active : ''}`}
                  onClick={() => setIsWideMode(!isWideMode)}
                  title={isWideMode ? "Constrained width" : "Full width"}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <polyline points="7 8 3 12 7 16" />
                    <polyline points="17 8 21 12 17 16" />
                  </svg>
                </button>
                <button
                  className={styles.fullscreenToggle}
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  title={isFullscreen ? "Exit fullscreen (Esc)" : "Fullscreen editing"}
                >
                  {isFullscreen ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M8 3v3a2 2 0 0 1-2 2H3" />
                      <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
                      <path d="M3 16h3a2 2 0 0 1 2 2v3" />
                      <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M8 3H5a2 2 0 0 0-2 2v3" />
                      <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
                      <path d="M3 16v3a2 2 0 0 0 2 2h3" />
                      <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
                    </svg>
                  )}
                </button>
              </div>
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
      <div className={`${styles.content} ${isEditMode ? styles.editMode : ''} ${isEditMode && isWideMode ? styles.wideMode : ''}`}>
        {isEditMode ? (
          <RichTextEditor
            content={editContent}
            onChange={setEditorHtml}
            placeholder="Start writing..."
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
              <h1 {...props} id={getHeadingId(children)}>
                {children}
              </h1>
            ),
            h2: ({ children, ...props }) => (
              <h2 {...props} id={getHeadingId(children)}>
                {children}
              </h2>
            ),
            h3: ({ children, ...props }) => (
              <h3 {...props} id={getHeadingId(children)}>
                {children}
              </h3>
            ),
            h4: ({ children, ...props }) => (
              <h4 {...props} id={getHeadingId(children)}>
                {children}
              </h4>
            ),
            h5: ({ children, ...props }) => (
              <h5 {...props} id={getHeadingId(children)}>
                {children}
              </h5>
            ),
            h6: ({ children, ...props }) => (
              <h6 {...props} id={getHeadingId(children)}>
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
