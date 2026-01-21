import { useState, useEffect } from "react";
import styles from "./EditorToolbar.module.css";

interface InsertMenuProps {
  onInsertCodeBlock: () => void;
  onInsertHorizontalRule: () => void;
  onInsertImage: (url: string) => void;
  onClose: () => void;
}

export default function InsertMenu({
  onInsertCodeBlock,
  onInsertHorizontalRule,
  onInsertImage,
  onClose,
}: InsertMenuProps) {
  const [showImageInput, setShowImageInput] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(`.${styles.insertMenu}`)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showImageInput) {
          setShowImageInput(false);
        } else {
          onClose();
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose, showImageInput]);

  const handleImageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (imageUrl.trim()) {
      onInsertImage(imageUrl.trim());
    }
  };

  if (showImageInput) {
    return (
      <div className={styles.insertMenu}>
        <form onSubmit={handleImageSubmit} className={styles.imageForm}>
          <input
            type="text"
            className={styles.linkInput}
            placeholder="Enter image URL..."
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            autoFocus
          />
          <div className={styles.linkActions}>
            <button
              type="button"
              className={styles.linkCancel}
              onClick={() => setShowImageInput(false)}
            >
              Back
            </button>
            <button
              type="submit"
              className={styles.linkSubmit}
              disabled={!imageUrl.trim()}
            >
              Insert
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className={styles.insertMenu}>
      <button
        type="button"
        className={styles.insertMenuItem}
        onClick={onInsertCodeBlock}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
        Code Block
      </button>
      <button
        type="button"
        className={styles.insertMenuItem}
        onClick={() => setShowImageInput(true)}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        Image (URL)
      </button>
      <button
        type="button"
        className={styles.insertMenuItem}
        onClick={onInsertHorizontalRule}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Horizontal Rule
      </button>
    </div>
  );
}
