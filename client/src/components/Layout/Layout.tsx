import { useState, useEffect, useRef } from "react";
import MarkdownViewer from "../MarkdownViewer/MarkdownViewer";
import Breadcrumb from "../Breadcrumb/Breadcrumb";
import TableOfContents from "../TableOfContents/TableOfContents";
import SearchBar from "../SearchBar/SearchBar";
import Toast from "../Toast/Toast";
import EmptyFilesManager from "../EmptyFilesManager/EmptyFilesManager";
import FileWhiteboard from "../FileWhiteboard/FileWhiteboard";
import NewEntryModal from "../NewEntryModal/NewEntryModal";
import ConfirmationModal from "../ConfirmationModal/ConfirmationModal";
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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [scrollToHeading, setScrollToHeading] = useState<{ id: string; timestamp: number } | null>(null);
  const [showEmptyFiles, setShowEmptyFiles] = useState(false);
  const [showFlowChart, setShowFlowChart] = useState(false);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [toasts, setToasts] = useState<
    Array<{ id: string; message: string; type: "info" | "success" | "warning" | "error" }>
  >([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const lastSelectedIndexRef = useRef<number | null>(null);
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
      // Ctrl+N or Cmd+N for new entry
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        setShowNewEntry(true);
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

  // Clear file content when no file is selected
  useEffect(() => {
    if (!selectedFileId) {
      setFileContent("");
    }
  }, [selectedFileId]);

  const selectedFile = files.find((f) => f.id === selectedFileId);

  // Get display name from file path
  const getDisplayName = (relativePath: string) => {
    const parts = relativePath.split('/');
    const fileName = parts[parts.length - 1];
    return fileName.replace(/\.md$/, '');
  };

  // Selection mode handlers
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      setSelectedFiles(new Set());
      lastSelectedIndexRef.current = null;
    }
  };

  const handleFileCheckboxChange = (fileId: string, index: number, shiftKey: boolean) => {
    setSelectedFiles((prev) => {
      const newSet = new Set(prev);

      // Shift+click for range selection
      if (shiftKey && lastSelectedIndexRef.current !== null) {
        const start = Math.min(lastSelectedIndexRef.current, index);
        const end = Math.max(lastSelectedIndexRef.current, index);
        for (let i = start; i <= end; i++) {
          newSet.add(files[i].id);
        }
      } else {
        if (newSet.has(fileId)) {
          newSet.delete(fileId);
        } else {
          newSet.add(fileId);
        }
        lastSelectedIndexRef.current = index;
      }

      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(files.map(f => f.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedFiles.size === 0) return;

    setDeleting(true);
    let successCount = 0;
    let failCount = 0;
    const deletedIds: string[] = [];

    for (const fileId of selectedFiles) {
      try {
        const response = await fetch(`/api/files/${encodeURIComponent(fileId)}`, {
          method: "DELETE",
        });

        if (response.ok) {
          successCount++;
          deletedIds.push(fileId);
        } else {
          failCount++;
        }
      } catch {
        failCount++;
      }
    }

    // Clear selection and refresh files
    setSelectedFiles(new Set());
    setShowDeleteConfirm(false);
    setDeleting(false);
    setIsSelectionMode(false);

    // If currently viewed file was deleted, clear selection
    if (selectedFileId && deletedIds.includes(selectedFileId)) {
      setSelectedFileId(null);
      setFileContent("");
    }

    // Refresh file list
    try {
      const response = await fetch("/api/files");
      if (response.ok) {
        const data = await response.json();
        setFiles(data);
      }
    } catch (err) {
      console.error("Error refreshing files:", err);
    }

    // Show toast
    const message = successCount > 0
      ? `Deleted ${successCount} file${successCount > 1 ? "s" : ""}${failCount > 0 ? ` (${failCount} failed)` : ""}`
      : "Failed to delete files";

    setToasts((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        message,
        type: successCount > 0 ? "success" : "error",
      },
    ]);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.brand}>
            <div className={styles.brandIcon}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
            <h1>mdReader</h1>
          </div>

          <div className={styles.headerControls}>
            {/* Navigation group */}
            <div className={styles.navGroup}>
              <button
                className={styles.navButton}
                disabled={!navigation.canGoBack}
                onClick={() => {
                  const prevFile = navigation.goBack();
                  if (prevFile) setSelectedFileId(prevFile);
                }}
                title="Back (Alt+Left)"
              >
                <span className={styles.navIcon}>←</span>
              </button>
              <button
                className={styles.navButton}
                disabled={!navigation.canGoForward}
                onClick={() => {
                  const nextFile = navigation.goForward();
                  if (nextFile) setSelectedFileId(nextFile);
                }}
                title="Forward (Alt+Right)"
              >
                <span className={styles.navIcon}>→</span>
              </button>
            </div>

            <div className={styles.headerDivider} />

            {/* View toggles */}
            <div className={styles.viewToggle}>
              <button
                className={`${styles.actionButton} ${!showFlowChart ? styles.active : ''}`}
                onClick={() => setShowFlowChart(false)}
                title="List view"
              >
                List
              </button>
              <button
                className={`${styles.actionButton} ${showFlowChart ? styles.active : ''}`}
                onClick={() => setShowFlowChart(true)}
                title="Graph view"
              >
                Graph
              </button>
            </div>

            <button
              className={`${styles.actionButton} ${showTOC ? styles.active : ''}`}
              onClick={() => setShowTOC(!showTOC)}
              title="Toggle Table of Contents (Ctrl+T)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
              <span className={styles.buttonLabel}>Outline</span>
            </button>

            <button
              className={`${styles.actionButton} ${showEmptyFiles ? styles.active : ''}`}
              onClick={() => setShowEmptyFiles(!showEmptyFiles)}
              title="View empty files"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span className={styles.buttonLabel}>Empty</span>
            </button>

            <div className={styles.headerDivider} />

            {/* Primary action */}
            <button
              className={styles.newButton}
              onClick={() => setShowNewEntry(true)}
              title="New Entry (Cmd+N)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              New
              <span className={styles.shortcut}>⌘N</span>
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
              {isSelectionMode ? (
                <>
                  <div className={styles.selectionInfo}>
                    <button
                      className={styles.selectAllButton}
                      onClick={handleSelectAll}
                      title={selectedFiles.size === files.length ? "Deselect all" : "Select all"}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {selectedFiles.size === files.length ? (
                          <>
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <line x1="9" y1="9" x2="15" y2="15" />
                            <line x1="15" y1="9" x2="9" y2="15" />
                          </>
                        ) : (
                          <>
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <polyline points="9 11 12 14 22 4" />
                          </>
                        )}
                      </svg>
                    </button>
                    <span className={styles.selectedCount}>
                      {selectedFiles.size} selected
                    </span>
                  </div>
                  <div className={styles.selectionActions}>
                    {selectedFiles.size > 0 && (
                      <button
                        className={styles.deleteButton}
                        onClick={() => setShowDeleteConfirm(true)}
                        title="Delete selected files"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    )}
                    <button
                      className={styles.cancelSelectButton}
                      onClick={toggleSelectionMode}
                      title="Cancel selection"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M1 1l12 12M13 1L1 13" />
                      </svg>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h2>Documents</h2>
                  <div className={styles.sidebarActions}>
                    <span className={styles.fileCount}>{files.length}</span>
                    {files.length > 0 && (
                      <button
                        className={styles.selectAllOutsideButton}
                        onClick={() => {
                          if (!isSelectionMode) {
                            setIsSelectionMode(true);
                          }
                          setSelectedFiles(new Set(files.map(f => f.id)));
                        }}
                        title="Select all files"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <polyline points="9 11 12 14 22 4" />
                        </svg>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
            {loading && (
              <div className={styles.fileList}>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className={`${styles.skeleton} ${styles.skeletonItem}`} />
                ))}
              </div>
            )}
            {error && <p className={styles.error}>{error}</p>}
            {!loading && files.length === 0 && (
              <div className={styles.noFilesState}>
                <div className={styles.noFilesIcon}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="12" y1="18" x2="12" y2="12" />
                    <line x1="9" y1="15" x2="15" y2="15" />
                  </svg>
                </div>
                <h3>No documents yet</h3>
                <p>Get started by creating or uploading a markdown file</p>
                <button
                  className={styles.addFirstFileButton}
                  onClick={() => setShowNewEntry(true)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add New Entry
                </button>
                <span className={styles.noFilesHint}>or drag and drop files here</span>
              </div>
            )}
            {!loading && files.length > 0 && (
              <ul className={styles.fileList}>
                {files.map((file, index) => (
                  <li
                    key={file.id}
                    className={`${styles.fileItem} ${
                      selectedFileId === file.id ? styles.active : ""
                    } ${isSelectionMode && selectedFiles.has(file.id) ? styles.selected : ""}`}
                    onClick={(e) => {
                      if (isSelectionMode) {
                        handleFileCheckboxChange(file.id, index, e.shiftKey);
                      } else {
                        handleFileSelect(file.id);
                      }
                    }}
                    title={file.relativePath}
                  >
                    {isSelectionMode && (
                      <span
                        className={`${styles.checkbox} ${selectedFiles.has(file.id) ? styles.checked : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFileCheckboxChange(file.id, index, e.shiftKey);
                        }}
                      >
                        {selectedFiles.has(file.id) && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </span>
                    )}
                    <span className={styles.fileName}>{getDisplayName(file.relativePath)}</span>
                    {file.relativePath.includes('/') && (
                      <span className={styles.filePath}>
                        {file.relativePath.split('/').slice(0, -1).join('/')}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </aside>

          <div className={styles.viewerContainer}>
            <main className={styles.viewer}>
              {!selectedFile ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4">
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    </svg>
                  </div>
                  <h3>Select a document</h3>
                  <p>Choose a markdown file from the sidebar to start reading</p>
                  <div className={styles.emptyHint}>
                    Press <kbd>⌘</kbd> + <kbd>F</kbd> to search
                  </div>
                </div>
              ) : (
                <MarkdownViewer
                  fileId={selectedFile.id}
                  fileName={selectedFile.name}
                  scrollToHeading={scrollToHeading?.id}
                  scrollKey={scrollToHeading?.timestamp}
                  showTOC={showTOC}
                  onToggleTOC={() => setShowTOC(!showTOC)}
                  onContentChange={setFileContent}
                />
              )}
            </main>
            {showTOC && selectedFile && (
              <TableOfContents
                content={fileContent}
                onScroll={(headingId) => setScrollToHeading({ id: headingId, timestamp: Date.now() })}
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

      {/* New Entry Modal */}
      <NewEntryModal
        isOpen={showNewEntry}
        onClose={() => setShowNewEntry(false)}
        onSuccess={(message) => {
          setToasts((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              message,
              type: "success",
            },
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
          fetchFiles();
        }}
        currentFolder={folderPath}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteSelected}
        title="Delete Files"
        message={`Are you sure you want to delete ${selectedFiles.size} file${selectedFiles.size > 1 ? "s" : ""}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
