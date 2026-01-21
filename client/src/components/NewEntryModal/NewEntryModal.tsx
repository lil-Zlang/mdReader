import { useState, useRef, DragEvent } from "react";
import styles from "./NewEntryModal.module.css";

interface NewEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  currentFolder?: string;
}

type InputMethod = "upload" | "quick" | "url";

interface UploadedFile {
  name: string;
  content: string;
  relativePath?: string;
}

export default function NewEntryModal({
  isOpen,
  onClose,
  onSuccess,
  currentFolder = "",
}: NewEntryModalProps) {
  const [method, setMethod] = useState<InputMethod>("upload");
  const [fileName, setFileName] = useState("");
  const [content, setContent] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const isMarkdownFile = (fileName: string): boolean => {
    const ext = fileName.toLowerCase();
    return ext.endsWith('.md') || ext.endsWith('.markdown') || ext.endsWith('.txt');
  };

  const processFiles = async (files: FileList | File[]): Promise<UploadedFile[]> => {
    const fileArray = Array.from(files);
    const mdFiles = fileArray.filter(file => isMarkdownFile(file.name));

    const processedFiles: UploadedFile[] = [];
    for (const file of mdFiles) {
      const content = await file.text();
      processedFiles.push({
        name: file.name,
        content,
        relativePath: (file as any).webkitRelativePath || file.name,
      });
    }
    return processedFiles;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const processed = await processFiles(e.target.files);
      setUploadedFiles(prev => [...prev, ...processed]);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const items = e.dataTransfer.items;
    const allFiles: File[] = [];

    // Process all items (files and folders)
    const processEntry = async (entry: FileSystemEntry): Promise<File[]> => {
      const files: File[] = [];

      if (entry.isFile) {
        const fileEntry = entry as FileSystemFileEntry;
        const file = await new Promise<File>((resolve) => {
          fileEntry.file(resolve);
        });
        if (isMarkdownFile(file.name)) {
          files.push(file);
        }
      } else if (entry.isDirectory) {
        const dirEntry = entry as FileSystemDirectoryEntry;
        const reader = dirEntry.createReader();
        const entries = await new Promise<FileSystemEntry[]>((resolve) => {
          reader.readEntries(resolve);
        });
        for (const subEntry of entries) {
          const subFiles = await processEntry(subEntry);
          files.push(...subFiles);
        }
      }
      return files;
    };

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const entry = item.webkitGetAsEntry();
      if (entry) {
        const files = await processEntry(entry);
        allFiles.push(...files);
      }
    }

    if (allFiles.length > 0) {
      const processed = await processFiles(allFiles);
      setUploadedFiles(prev => [...prev, ...processed]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllFiles = () => {
    setUploadedFiles([]);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Handle upload method with multiple files
      if (method === "upload" && uploadedFiles.length > 0) {
        let successCount = 0;
        let failCount = 0;

        for (const file of uploadedFiles) {
          try {
            const response = await fetch("/api/files", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                fileName: file.name,
                content: file.content,
                folder: currentFolder,
              }),
            });

            if (response.ok) {
              successCount++;
            } else {
              failCount++;
            }
          } catch {
            failCount++;
          }
        }

        if (successCount > 0) {
          onSuccess(`Created ${successCount} file${successCount > 1 ? 's' : ''}${failCount > 0 ? ` (${failCount} failed)` : ''}`);
        } else {
          throw new Error("Failed to create files");
        }
        handleClose();
        return;
      }

      // Handle other methods (single file)
      let finalFileName = fileName.trim();
      let finalContent = content;

      if (method === "url" && url.trim()) {
        const response = await fetch(`/api/fetch-url?url=${encodeURIComponent(url)}`);
        if (response.ok) {
          finalContent = await response.text();
        } else {
          throw new Error("Failed to fetch URL content");
        }
      }

      if (!finalFileName) {
        alert("Please enter a file name");
        setLoading(false);
        return;
      }

      if (!finalFileName.endsWith(".md")) {
        finalFileName += ".md";
      }

      const response = await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: finalFileName,
          content: finalContent,
          folder: currentFolder,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create file");
      }

      onSuccess(`Created: ${finalFileName}`);
      handleClose();
    } catch (error) {
      console.error("Error creating file:", error);
      alert(error instanceof Error ? error.message : "Failed to create file");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFileName("");
    setContent("");
    setUploadedFiles([]);
    setUrl("");
    setMethod("upload");
    onClose();
  };

  const canSubmit = () => {
    if (loading) return false;
    if (method === "upload") return uploadedFiles.length > 0;
    if (method === "quick") return !!fileName.trim();
    if (method === "url") return !!url.trim() && !!fileName.trim();
    return false;
  };

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Add New Entry</h2>
          <button className={styles.closeButton} onClick={handleClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M1 1l12 12M13 1L1 13" />
            </svg>
          </button>
        </div>

        {/* Method Selection Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${method === "upload" ? styles.active : ""}`}
            onClick={() => setMethod("upload")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Upload
          </button>
          <button
            className={`${styles.tab} ${method === "quick" ? styles.active : ""}`}
            onClick={() => setMethod("quick")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 19l7-7 3 3-7 7-3-3z" />
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
              <path d="M2 2l7.586 7.586" />
              <circle cx="11" cy="11" r="2" />
            </svg>
            Quick Note
          </button>
          <button
            className={`${styles.tab} ${method === "url" ? styles.active : ""}`}
            onClick={() => setMethod("url")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
            </svg>
            URL
          </button>
        </div>

        <div className={styles.content}>
          {/* Upload Files or Folder */}
          {method === "upload" && (
            <div className={styles.section}>
              <div
                className={`${styles.uploadArea} ${isDragging ? styles.dragging : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".md,.markdown,.txt"
                  multiple
                  onChange={handleFileSelect}
                  className={styles.fileInput}
                  id="file-upload"
                />
                <input
                  ref={folderInputRef}
                  type="file"
                  // @ts-expect-error - webkitdirectory is not in types
                  webkitdirectory=""
                  multiple
                  onChange={handleFileSelect}
                  className={styles.fileInput}
                  id="folder-upload"
                />

                <div className={styles.uploadContent}>
                  <div className={styles.uploadIcon}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>
                  <p className={styles.uploadTitle}>
                    {isDragging ? "Drop files here" : "Drag & drop files or folders"}
                  </p>
                  <p className={styles.uploadHint}>Only .md, .markdown, and .txt files will be imported</p>

                  <div className={styles.uploadButtons}>
                    <button
                      type="button"
                      className={styles.uploadButton}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      Select Files
                    </button>
                    <button
                      type="button"
                      className={styles.uploadButton}
                      onClick={() => folderInputRef.current?.click()}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                      </svg>
                      Select Folder
                    </button>
                  </div>
                </div>
              </div>

              {/* File List */}
              {uploadedFiles.length > 0 && (
                <div className={styles.fileList}>
                  <div className={styles.fileListHeader}>
                    <span className={styles.fileCount}>
                      {uploadedFiles.length} file{uploadedFiles.length > 1 ? 's' : ''} selected
                    </span>
                    <button
                      type="button"
                      className={styles.clearButton}
                      onClick={clearAllFiles}
                    >
                      Clear all
                    </button>
                  </div>
                  <ul className={styles.fileItems}>
                    {uploadedFiles.map((file, index) => (
                      <li key={index} className={styles.fileItem}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                        <span className={styles.fileName}>{file.name}</span>
                        <button
                          type="button"
                          className={styles.removeButton}
                          onClick={() => removeFile(index)}
                          aria-label="Remove file"
                        >
                          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M1 1l12 12M13 1L1 13" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Quick Note */}
          {method === "quick" && (
            <div className={styles.section}>
              <label className={styles.label}>
                File Name
                <input
                  type="text"
                  className={styles.input}
                  placeholder="my-note.md"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  autoFocus
                />
              </label>
              <label className={styles.label}>
                Content
                <textarea
                  className={styles.textarea}
                  placeholder="# Title&#10;&#10;Start writing your markdown here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={12}
                />
              </label>
            </div>
          )}

          {/* From URL */}
          {method === "url" && (
            <div className={styles.section}>
              <label className={styles.label}>
                URL
                <input
                  type="url"
                  className={styles.input}
                  placeholder="https://raw.githubusercontent.com/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  autoFocus
                />
              </label>
              <label className={styles.label}>
                File Name
                <input
                  type="text"
                  className={styles.input}
                  placeholder="imported-note.md"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                />
              </label>
              <p className={styles.hint}>Fetch markdown content from a URL</p>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelButton} onClick={handleClose}>
            Cancel
          </button>
          <button
            className={styles.submitButton}
            onClick={handleSubmit}
            disabled={!canSubmit()}
          >
            {loading ? "Creating..." : method === "upload" && uploadedFiles.length > 1 ? `Create ${uploadedFiles.length} Files` : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
