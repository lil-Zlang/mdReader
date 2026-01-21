import { useEffect } from "react";
import styles from "./EditorToolbar.module.css";

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

const EMOJI_CATEGORIES = [
  {
    name: "Smileys",
    emojis: ["😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😋", "😛", "😜", "🤪", "😝", "🤗", "🤔", "🤭", "🤫", "🤥", "😐", "😑", "😶", "😏", "😒", "🙄", "😬", "😮‍💨", "🤤", "😪", "😴", "😷", "🤒"],
  },
  {
    name: "Gestures",
    emojis: ["👍", "👎", "👌", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "👇", "☝️", "✋", "🤚", "🖐️", "🖖", "👋", "🤏", "✍️", "🙏", "💪", "🦾", "👏", "🤝", "🙌"],
  },
  {
    name: "Objects",
    emojis: ["💡", "📝", "📚", "📖", "📁", "📂", "📌", "📎", "🔗", "✂️", "📏", "📐", "🔍", "🔎", "💻", "🖥️", "⌨️", "🖱️", "💾", "📀", "🎯", "🏆", "🎉", "✨", "⭐", "🌟", "💫"],
  },
  {
    name: "Symbols",
    emojis: ["✅", "❌", "❓", "❗", "💯", "🔥", "⚡", "💥", "🎵", "🎶", "➡️", "⬅️", "⬆️", "⬇️", "↔️", "↕️", "🔄", "➕", "➖", "✖️", "➗", "♾️", "💲", "💰", "©️", "®️", "™️"],
  },
];

export default function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(`.${styles.emojiPicker}`)) {
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

  return (
    <div className={styles.emojiPicker}>
      {EMOJI_CATEGORIES.map((category) => (
        <div key={category.name} className={styles.emojiCategory}>
          <div className={styles.emojiCategoryName}>{category.name}</div>
          <div className={styles.emojiGrid}>
            {category.emojis.map((emoji, index) => (
              <button
                key={index}
                type="button"
                className={styles.emojiButton}
                onClick={() => onSelect(emoji)}
                title={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
