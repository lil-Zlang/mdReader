import { useState } from "react";
import styles from "./WelcomeScreen.module.css";

interface WelcomeScreenProps {
  onFolderSelected: (path: string) => void;
}

export default function WelcomeScreen({ onFolderSelected }: WelcomeScreenProps) {
  const [selectedPath, setSelectedPath] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleFolderPicker = async () => {
    if (!window.showDirectoryPicker) {
      alert(
        "Folder picker not supported. Please manually enter the folder path."
      );
      return;
    }

    try {
      const dirHandle = await window.showDirectoryPicker();
      const path = dirHandle.name;
      setSelectedPath(path);
      setLoading(true);
      await onFolderSelected(path);
      setLoading(false);
    } catch (error) {
      console.error("Error selecting folder:", error);
    }
  };

  const handlePathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedPath(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPath.trim()) {
      alert("Please enter a valid folder path.");
      return;
    }
    setLoading(true);
    try {
      await onFolderSelected(selectedPath);
    } catch (error) {
      console.error("Error:", error);
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.brandMark}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <h1>mdReader</h1>
          <p className={styles.subtitle}>
            A refined way to read and explore your markdown files
          </p>
        </div>

        <div className={styles.content}>
          <h2>Get Started</h2>
          <p className={styles.description}>
            Select a folder containing your markdown files to begin.
          </p>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="folderPath">Folder Path</label>
              <input
                id="folderPath"
                type="text"
                value={selectedPath}
                onChange={handlePathChange}
                placeholder="/path/to/your/markdown/files"
                disabled={loading}
                className={styles.input}
              />
            </div>

            <div className={styles.buttons}>
              <button
                type="button"
                onClick={handleFolderPicker}
                disabled={loading}
                className={styles.pickerButton}
              >
                {loading ? (
                  <>
                    <span className={styles.spinner}></span>
                    Loading...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    </svg>
                    Browse
                  </>
                )}
              </button>
              <button
                type="submit"
                disabled={loading || !selectedPath.trim()}
                className={styles.submitButton}
              >
                {loading ? "Loading..." : "Continue"}
                {!loading && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                )}
              </button>
            </div>
          </form>

          <div className={styles.features}>
            <h3>Features</h3>
            <ul>
              <li>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-terracotta)' }}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Beautiful markdown rendering with syntax highlighting
              </li>
              <li>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-terracotta)' }}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Auto-detected backlinks between documents
              </li>
              <li>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-terracotta)' }}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Full-text search across all files
              </li>
              <li>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-terracotta)' }}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Interactive knowledge graph visualization
              </li>
              <li>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-terracotta)' }}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Real-time file synchronization
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
