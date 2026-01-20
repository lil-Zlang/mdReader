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
          <h1>mdReader</h1>
          <p className={styles.subtitle}>
            The fastest, most beautiful way to read markdown locally
          </p>
        </div>

        <div className={styles.content}>
          <div className={styles.icon}>📖</div>

          <h2>Welcome to mdReader</h2>
          <p className={styles.description}>
            Select a folder containing your markdown files to get started.
          </p>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="folderPath">Folder Path:</label>
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
                {loading ? "Loading..." : "📁 Select Folder"}
              </button>
              <button
                type="submit"
                disabled={loading || !selectedPath.trim()}
                className={styles.submitButton}
              >
                {loading ? "Loading..." : "Continue"}
              </button>
            </div>
          </form>

          <div className={styles.features}>
            <h3>Features:</h3>
            <ul>
              <li>✨ Beautiful markdown rendering</li>
              <li>🔗 Auto-detected backlinks</li>
              <li>🔍 Full-text search</li>
              <li>📊 Knowledge graph visualization</li>
              <li>⚡ Real-time file sync</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
