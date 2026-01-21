import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import { useEffect } from "react";
import EditorToolbar from "./EditorToolbar";
import { markdownToHtml, countWords } from "../../utils/markdownConverter";
import styles from "./RichTextEditor.module.css";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder = "Start writing...",
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "editor-link",
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Underline,
      Image.configure({
        inline: false,
        allowBase64: true,
      }),
    ],
    content: "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: styles.proseMirror,
      },
    },
  });

  // Load initial content
  useEffect(() => {
    if (editor && content) {
      const html = markdownToHtml(content);
      editor.commands.setContent(html);
    }
  }, [editor]);

  // Get word count from editor
  const wordCount = editor ? countWords(editor.getText()) : 0;

  if (!editor) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading editor...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <EditorToolbar editor={editor} wordCount={wordCount} />
      <div className={styles.editorWrapper}>
        <EditorContent editor={editor} className={styles.editor} />
      </div>
    </div>
  );
}
