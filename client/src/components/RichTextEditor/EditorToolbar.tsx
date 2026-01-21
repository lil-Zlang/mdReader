import { useState, useCallback } from "react";
import type { Editor } from "@tiptap/react";
import LinkModal from "./LinkModal";
import EmojiPicker from "./EmojiPicker";
import InsertMenu from "./InsertMenu";
import styles from "./EditorToolbar.module.css";

interface EditorToolbarProps {
  editor: Editor;
  wordCount: number;
}

type HeadingLevel = 1 | 2 | 3;

export default function EditorToolbar({ editor, wordCount }: EditorToolbarProps) {
  const [showHeadingMenu, setShowHeadingMenu] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showInsertMenu, setShowInsertMenu] = useState(false);

  const getActiveHeading = () => {
    if (editor.isActive("heading", { level: 1 })) return "H1";
    if (editor.isActive("heading", { level: 2 })) return "H2";
    if (editor.isActive("heading", { level: 3 })) return "H3";
    return "Body";
  };

  const setHeading = (level: HeadingLevel | null) => {
    if (level === null) {
      editor.chain().focus().setParagraph().run();
    } else {
      editor.chain().focus().toggleHeading({ level }).run();
    }
    setShowHeadingMenu(false);
  };

  const handleLinkSubmit = useCallback(
    (url: string, text?: string) => {
      if (url) {
        if (text && editor.state.selection.empty) {
          editor
            .chain()
            .focus()
            .insertContent(`<a href="${url}">${text}</a>`)
            .run();
        } else {
          editor.chain().focus().setLink({ href: url }).run();
        }
      }
      setShowLinkModal(false);
    },
    [editor]
  );

  const handleEmojiSelect = useCallback(
    (emoji: string) => {
      editor.chain().focus().insertContent(emoji).run();
      setShowEmojiPicker(false);
    },
    [editor]
  );

  const handleInsertCodeBlock = useCallback(() => {
    editor.chain().focus().toggleCodeBlock().run();
    setShowInsertMenu(false);
  }, [editor]);

  const handleInsertHorizontalRule = useCallback(() => {
    editor.chain().focus().setHorizontalRule().run();
    setShowInsertMenu(false);
  }, [editor]);

  const handleInsertImage = useCallback(
    (url: string) => {
      if (url) {
        editor.chain().focus().setImage({ src: url }).run();
      }
      setShowInsertMenu(false);
    },
    [editor]
  );

  return (
    <div className={styles.toolbar}>
      <div className={styles.toolbarGroup}>
        {/* Bold */}
        <button
          type="button"
          className={`${styles.toolbarButton} ${editor.isActive("bold") ? styles.active : ""}`}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold (Ctrl+B)"
        >
          <strong>B</strong>
        </button>

        {/* Italic */}
        <button
          type="button"
          className={`${styles.toolbarButton} ${editor.isActive("italic") ? styles.active : ""}`}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic (Ctrl+I)"
        >
          <em>I</em>
        </button>

        {/* Strikethrough */}
        <button
          type="button"
          className={`${styles.toolbarButton} ${editor.isActive("strike") ? styles.active : ""}`}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Strikethrough"
        >
          <s>S</s>
        </button>

        <div className={styles.divider} />

        {/* Heading dropdown */}
        <div className={styles.dropdownWrapper}>
          <button
            type="button"
            className={`${styles.toolbarButton} ${styles.dropdownTrigger}`}
            onClick={() => setShowHeadingMenu(!showHeadingMenu)}
            title="Heading"
          >
            {getActiveHeading()}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {showHeadingMenu && (
            <div className={styles.dropdown}>
              <button
                type="button"
                className={`${styles.dropdownItem} ${!editor.isActive("heading") ? styles.active : ""}`}
                onClick={() => setHeading(null)}
              >
                Body
              </button>
              <button
                type="button"
                className={`${styles.dropdownItem} ${editor.isActive("heading", { level: 1 }) ? styles.active : ""}`}
                onClick={() => setHeading(1)}
              >
                Heading 1
              </button>
              <button
                type="button"
                className={`${styles.dropdownItem} ${editor.isActive("heading", { level: 2 }) ? styles.active : ""}`}
                onClick={() => setHeading(2)}
              >
                Heading 2
              </button>
              <button
                type="button"
                className={`${styles.dropdownItem} ${editor.isActive("heading", { level: 3 }) ? styles.active : ""}`}
                onClick={() => setHeading(3)}
              >
                Heading 3
              </button>
            </div>
          )}
        </div>

        <div className={styles.divider} />

        {/* Blockquote */}
        <button
          type="button"
          className={`${styles.toolbarButton} ${editor.isActive("blockquote") ? styles.active : ""}`}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Blockquote"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z" />
            <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
          </svg>
        </button>

        {/* Bullet list */}
        <button
          type="button"
          className={`${styles.toolbarButton} ${editor.isActive("bulletList") ? styles.active : ""}`}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet list"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <circle cx="4" cy="6" r="1" fill="currentColor" />
            <circle cx="4" cy="12" r="1" fill="currentColor" />
            <circle cx="4" cy="18" r="1" fill="currentColor" />
          </svg>
        </button>

        {/* Numbered list */}
        <button
          type="button"
          className={`${styles.toolbarButton} ${editor.isActive("orderedList") ? styles.active : ""}`}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numbered list"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="10" y1="6" x2="21" y2="6" />
            <line x1="10" y1="12" x2="21" y2="12" />
            <line x1="10" y1="18" x2="21" y2="18" />
            <text x="3" y="7" fontSize="6" fill="currentColor" fontFamily="sans-serif">1</text>
            <text x="3" y="13" fontSize="6" fill="currentColor" fontFamily="sans-serif">2</text>
            <text x="3" y="19" fontSize="6" fill="currentColor" fontFamily="sans-serif">3</text>
          </svg>
        </button>

        <div className={styles.divider} />

        {/* Link */}
        <div className={styles.dropdownWrapper}>
          <button
            type="button"
            className={`${styles.toolbarButton} ${editor.isActive("link") ? styles.active : ""}`}
            onClick={() => setShowLinkModal(!showLinkModal)}
            title="Insert link"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          </button>
          {showLinkModal && (
            <LinkModal
              onSubmit={handleLinkSubmit}
              onClose={() => setShowLinkModal(false)}
              initialUrl={editor.getAttributes("link").href || ""}
            />
          )}
        </div>

        {/* Emoji */}
        <div className={styles.dropdownWrapper}>
          <button
            type="button"
            className={styles.toolbarButton}
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            title="Insert emoji"
          >
            <span role="img" aria-label="emoji">
              :)
            </span>
          </button>
          {showEmojiPicker && (
            <EmojiPicker
              onSelect={handleEmojiSelect}
              onClose={() => setShowEmojiPicker(false)}
            />
          )}
        </div>

        {/* Insert menu */}
        <div className={styles.dropdownWrapper}>
          <button
            type="button"
            className={`${styles.toolbarButton} ${styles.dropdownTrigger}`}
            onClick={() => setShowInsertMenu(!showInsertMenu)}
            title="Insert"
          >
            Insert
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {showInsertMenu && (
            <InsertMenu
              onInsertCodeBlock={handleInsertCodeBlock}
              onInsertHorizontalRule={handleInsertHorizontalRule}
              onInsertImage={handleInsertImage}
              onClose={() => setShowInsertMenu(false)}
            />
          )}
        </div>
      </div>

      {/* Word count */}
      <div className={styles.wordCount}>
        {wordCount} {wordCount === 1 ? "word" : "words"}
      </div>
    </div>
  );
}
