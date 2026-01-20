import { useState, useEffect } from "react";
import MarkdownViewer from "../MarkdownViewer/MarkdownViewer";
import Breadcrumb from "../Breadcrumb/Breadcrumb";
import TableOfContents from "../TableOfContents/TableOfContents";
import BacklinksPanel from "../BacklinksPanel/BacklinksPanel";
import SearchBar from "../SearchBar/SearchBar";
import Toast from "../Toast/Toast";
import EmptyFilesManager from "../EmptyFilesManager/EmptyFilesManager";
import FileWhiteboard from "../FileWhiteboard/FileWhiteboard";
import { useNavigationHistory } from "../../hooks/useNavigationHistory";
import { useWebSocket } from "../../hooks/useWebSocket";
import styles from "./Layout.module.css";

interface LayoutProps {
  folderPath: string;
}

interface MarkdownFile {
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

export default function Layout({ folderPath }: LayoutProps) {
  const [files, setFiles] = useState<MarkdownFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [showTOC, setShowTOC] = useState(true);
  const [showBacklinks, setShowBacklinks] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [scrollToHeading, setScrollToHeading] = useState<string | null>(null);
  const [showEmptyFiles, setShowEmptyFiles] = useState(false);
  const [showFlowChart, setShowFlowChart] = useState(false);
  const [toasts, setToasts] = useState<
    Array<{ id: string; message: string; type: "info" | "success" | "warning" | "error" }>
  >([]);
  const navigation = useNavigationHistory();

  // WebSocket connection for real-time file updates
  useWebSocket((event) => {
    // Add toast notification
    const toastId = Date.now().toString();
    const toastMessage =
      event.type === "added"
        ? `File added: ${event.name}`
        : event.type === "deleted"
          ? `File deleted: ${event.name}`
          : event.type === "modified"
            ? `File updated: ${event.name}`
            : `File renamed: ${event.name}`;

    setToasts((prev) => [
      ...prev,
      { id: toastId, message: toastMessage, type: "info" },
    ]);

    // Refresh file list
    const fetchFiles = async () => {
      try {
        const response = await fetch("/api/files");
        if (response.ok) {
          const data = await response.json();
          setFiles(data);
        }
      } catch (err) {
        console.error("Error refreshing files:", err);
      }
    };

    if (event.type === "added" || event.type === "deleted") {
      fetchFiles();
    } else if (event.type === "modified" && event.path) {
      // Refresh current file if it was modified
      if (selectedFileId && event.path.includes(selectedFileId)) {
        // Re-fetch the content
        const response = fetch(`/api/files/${selectedFileId}`);
      }
    }
  });

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await fetch("/api/files");
        if (!response.ok) {
          throw new Error("Failed to load files");
        }
        const data = await response.json();
        setFiles(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        console.error("Error loading files:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, [folderPath]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+F or Cmd+F for search
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        setIsSearchOpen(!isSearchOpen);
      }
      // Alt+Left for back
      if (e.altKey && e.key === "ArrowLeft") {
        e.preventDefault();
        const prevFile = navigation.goBack();
        if (prevFile) {
          setSelectedFileId(prevFile);
        }
      }
      // Alt+Right for forward
      if (e.altKey && e.key === "ArrowRight") {
        e.preventDefault();
        const nextFile = navigation.goForward();
        if (nextFile) {
          setSelectedFileId(nextFile);
        }
      }
      // Ctrl+T or Cmd+T to toggle TOC
      if ((e.ctrlKey || e.metaKey) && e.key === "t") {
        e.preventDefault();
        setShowTOC(!showTOC);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigation, showTOC, isSearchOpen]);

  const handleFileSelect = (fileId: string) => {
    setSelectedFileId(fileId);
    navigation.push(fileId);
  };

  // Fetch file content for TOC
  useEffect(() => {
    if (!selectedFileId) return;

    const fetchContent = async () => {
      try {
        const response = await fetch(`/api/files/${selectedFileId}`);
        if (response.ok) {
          const data = await response.json();
          setFileContent(data.content || "");
        }
      } catch (err) {
        console.error("Error fetching file content for TOC:", err);
      }
    };

    fetchContent();
  }, [selectedFileId]);

  const selectedFile = files.find((f) => f.id === selectedFileId);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <h1>mdReader</h1>
          <div className={styles.headerControls}>
            <button
              className={styles.navButton}
              disabled={!navigation.canGoBack}
              onClick={() => {
                const prevFile = navigation.goBack();
                if (prevFile) setSelectedFileId(prevFile);
              }}
              title="Back (Alt+←)"
            >
              ← Back
            </button>
            <button
              className={styles.navButton}
              disabled={!navigation.canGoForward}
              onClick={() => {
                const nextFile = navigation.goForward();
                if (nextFile) setSelectedFileId(nextFile);
              }}
              title="Forward (Alt+→)"
            >
              Forward →
            </button>
            <button
              className={styles.tocToggle}
              onClick={() => setShowTOC(!showTOC)}
              title="Toggle TOC (Ctrl+T)"
            >
              {showTOC ? "Hide TOC" : "Show TOC"}
            </button>
            <button
              className={styles.tocToggle}
              onClick={() => setShowBacklinks(!showBacklinks)}
              title="Toggle Backlinks"
            >
              {showBacklinks ? "Hide Links" : "Show Links"}
            </button>
            <button
              className={styles.tocToggle}
              onClick={() => setShowEmptyFiles(!showEmptyFiles)}
              title="View empty files"
            >
              {showEmptyFiles ? "Hide Empty" : "Show Empty"}
            </button>
            <button
              className={styles.tocToggle}
              onClick={() => setShowFlowChart(!showFlowChart)}
              title="View flow chart"
            >
              {showFlowChart ? "Hide Flow" : "Show Flow"}
            </button>
          </div>
        </div>
        {selectedFile && (
          <Breadcrumb path={selectedFile.relativePath} />
        )}
      </header>

      {showFlowChart && (
        <FileWhiteboard
          files={files}
          folderPath={folderPath}
          onFileSelect={(fileId: string) => {
            setShowFlowChart(false);
            handleFileSelect(fileId);
          }}
        />
      )}

      {!showFlowChart && (
        <div className={styles.main}>
          <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h2>Files</h2>
          </div>
          {loading && <p className={styles.message}>Loading files...</p>}
          {error && <p className={styles.error}>{error}</p>}
          {!loading && files.length === 0 && (
            <p className={styles.message}>No markdown files found</p>
          )}
          {!loading && files.length > 0 && (
            <ul className={styles.fileList}>
              {files.map((file) => (
                <li
                  key={file.id}
                  className={`${styles.fileItem} ${
                    selectedFileId === file.id ? styles.active : ""
                  }`}
                  onClick={() => handleFileSelect(file.id)}
                >
                  <span className={styles.fileName}>{file.name}</span>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <div className={styles.viewerContainer}>
          <main className={styles.viewer}>
            {!selectedFile ? (
              <div className={styles.emptyState}>
                <p>📖 Select a file to view</p>
              </div>
            ) : (
              <MarkdownViewer
                fileId={selectedFile.id}
                fileName={selectedFile.name}
                scrollToHeading={scrollToHeading || undefined}
              />
            )}
          </main>
          {showTOC && selectedFile && (
            <TableOfContents
              content={fileContent}
              onScroll={(headingId) => setScrollToHeading(headingId)}
            />
          )}
          {showBacklinks && selectedFile && (
            <BacklinksPanel
              fileId={selectedFile.id}
              onNavigate={(fileId) => handleFileSelect(fileId)}
            />
          )}
        </div>
      </div>
      )}

      <SearchBar
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={(fileId) => handleFileSelect(fileId)}
      />

      {/* Toast notifications */}
      <div className={styles.toastContainer}>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={3000}
            onClose={() => {
              setToasts((prev) => prev.filter((t) => t.id !== toast.id));
            }}
          />
        ))}
      </div>

      {/* Empty Files Manager */}
      <EmptyFilesManager
        files={files}
        isOpen={showEmptyFiles}
        onClose={() => setShowEmptyFiles(false)}
        onFileSelect={(fileId) => {
          setShowEmptyFiles(false);
          handleFileSelect(fileId);
        }}
        onLevelAssign={(fileId, level) => {
          const message = `Assigned level "${level}" to file`;
          setToasts((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              message,
              type: "success",
            },
          ]);
        }}
      />
    </div>
  );
}
