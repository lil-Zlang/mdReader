import { useEffect, useState } from "react";
import styles from "./EmptyFilesManager.module.css";

interface EmptyFile {
  id: string;
  name: string;
  path: string;
  size: number;
}

interface EmptyFilesManagerProps {
  files: Array<{ id: string; name: string; path: string; metadata: { size: number } }>;
  isOpen: boolean;
  onClose?: () => void;
  onFileSelect?: (fileId: string) => void;
  onLevelAssign?: (fileId: string, level: string) => void;
}

export default function EmptyFilesManager({
  files,
  isOpen,
  onClose,
  onFileSelect,
  onLevelAssign,
}: EmptyFilesManagerProps) {
  const [emptyFiles, setEmptyFiles] = useState<EmptyFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [levels, setLevels] = useState<Record<string, string>>({});

  useEffect(() => {
    // Check which files are empty
    const checkEmpty = async () => {
      setLoading(true);
      const empty: EmptyFile[] = [];

      for (const file of files) {
        try {
          const response = await fetch(`/api/files/${file.id}`);
          if (response.ok) {
            const data = await response.json();
            if (!data.content || data.content.trim().length === 0) {
              empty.push({
                id: file.id,
                name: file.name,
                path: file.path,
                size: file.metadata.size,
              });
            }
          }
        } catch (err) {
          console.error("Error checking file:", err);
        }
      }

      setEmptyFiles(empty);
      setLoading(false);
    };

    if (isOpen) {
      checkEmpty();
    }
  }, [isOpen, files]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Empty Files Management</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.content}>
          {loading && <p className={styles.loading}>Scanning files...</p>}

          {!loading && emptyFiles.length === 0 && (
            <p className={styles.empty}>No empty files found!</p>
          )}

          {!loading && emptyFiles.length > 0 && (
            <div className={styles.grid}>
              {emptyFiles.map((file) => (
                <div key={file.id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h3 className={styles.fileName}>{file.name}</h3>
                    <span className={styles.path}>{file.path}</span>
                  </div>

                  <div className={styles.cardBody}>
                    <p className={styles.info}>
                      <strong>Size:</strong> {file.size} bytes
                    </p>

                    <div className={styles.levelSelector}>
                      <label>Assign Level:</label>
                      <select
                        value={levels[file.id] || ""}
                        onChange={(e) => {
                          setLevels((prev) => ({
                            ...prev,
                            [file.id]: e.target.value,
                          }));
                          onLevelAssign?.(file.id, e.target.value);
                        }}
                        className={styles.select}
                      >
                        <option value="">-- Select Level --</option>
                        <option value="todo">📝 TODO - To Do</option>
                        <option value="stub">🔧 Stub - Framework</option>
                        <option value="draft">✍️ Draft - In Progress</option>
                        <option value="review">👀 Review - Needs Review</option>
                        <option value="complete">✅ Complete - Done</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.cardFooter}>
                    <button
                      className={styles.primaryButton}
                      onClick={() => onFileSelect?.(file.id)}
                    >
                      Edit File
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <p className={styles.summary}>
            Found <strong>{emptyFiles.length}</strong> empty file{emptyFiles.length !== 1 ? "s" : ""}
          </p>
          <button className={styles.closeActionButton} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
