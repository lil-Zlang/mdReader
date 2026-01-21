import { useState, useEffect, useRef } from "react";
import styles from "./EditorToolbar.module.css";

interface LinkModalProps {
  onSubmit: (url: string, text?: string) => void;
  onClose: () => void;
  initialUrl?: string;
}

export default function LinkModal({ onSubmit, onClose, initialUrl = "" }: LinkModalProps) {
  const [url, setUrl] = useState(initialUrl);
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(`.${styles.linkModal}`)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      let finalUrl = url.trim();
      if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
        finalUrl = "https://" + finalUrl;
      }
      onSubmit(finalUrl, text.trim() || undefined);
    }
  };

  return (
    <div className={styles.linkModal}>
      <form onSubmit={handleSubmit}>
        <div className={styles.linkField}>
          <label className={styles.linkLabel}>URL</label>
          <input
            ref={inputRef}
            type="text"
            className={styles.linkInput}
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
        <div className={styles.linkField}>
          <label className={styles.linkLabel}>Text (optional)</label>
          <input
            type="text"
            className={styles.linkInput}
            placeholder="Link text"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
        <div className={styles.linkActions}>
          <button type="button" className={styles.linkCancel} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={styles.linkSubmit} disabled={!url.trim()}>
            Insert
          </button>
        </div>
      </form>
    </div>
  );
}
