import { useState } from "react";
import styles from "./NewEntryModal.module.css";

interface NewEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  currentFolder?: string;
}

type InputMethod = "quick" | "upload" | "blank" | "template" | "url";

const templates = [
  { id: "meeting", name: "Meeting Notes", content: "# Meeting Notes\n\n**Date:** \n**Attendees:** \n\n## Agenda\n- \n\n## Discussion\n\n## Action Items\n- [ ] \n" },
  { id: "journal", name: "Daily Journal", content: `# ${new Date().toLocaleDateString()}\n\n## Morning\n\n## Afternoon\n\n## Evening\n\n## Gratitude\n- \n` },
  { id: "project", name: "Project Plan", content: "# Project Name\n\n## Overview\n\n## Goals\n- \n\n## Tasks\n- [ ] \n\n## Resources\n\n## Timeline\n" },
  { id: "todo", name: "TODO List", content: "# TODO\n\n## High Priority\n- [ ] \n\n## Medium Priority\n- [ ] \n\n## Low Priority\n- [ ] \n" },
];

export default function NewEntryModal({
  isOpen,
  onClose,
  onSuccess,
  currentFolder = "",
}: NewEntryModalProps) {
  const [method, setMethod] = useState<InputMethod>("quick");
  const [fileName, setFileName] = useState("");
  const [content, setContent] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      let finalFileName = fileName.trim();
      let finalContent = content;

      // Handle different input methods
      if (method === "upload" && uploadFile) {
        finalFileName = uploadFile.name;
        finalContent = await uploadFile.text();
      } else if (method === "template" && selectedTemplate) {
        const template = templates.find(t => t.id === selectedTemplate);
        if (template) {
          finalContent = template.content;
        }
      } else if (method === "url" && url.trim()) {
        // Fetch content from URL
        const response = await fetch(`/api/fetch-url?url=${encodeURIComponent(url)}`);
        if (response.ok) {
          finalContent = await response.text();
        } else {
          throw new Error("Failed to fetch URL content");
        }
      }

      // Validate filename after processing upload/template
      if (!finalFileName) {
        alert("Please enter a file name");
        setLoading(false);
        return;
      }

      // Add .md extension if not present
      if (!finalFileName.endsWith(".md")) {
        finalFileName += ".md";
      }

      // Create the file
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
    setSelectedTemplate("");
    setUploadFile(null);
    setUrl("");
    setMethod("quick");
    onClose();
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setContent(template.content);
      if (!fileName) {
        setFileName(template.name.toLowerCase().replace(/\s+/g, "-"));
      }
    }
  };

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Add New Entry</h2>
          <button className={styles.closeButton} onClick={handleClose}>
            ✕
          </button>
        </div>

        {/* Method Selection Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${method === "quick" ? styles.active : ""}`}
            onClick={() => setMethod("quick")}
          >
            📝 Quick Note
          </button>
          <button
            className={`${styles.tab} ${method === "upload" ? styles.active : ""}`}
            onClick={() => setMethod("upload")}
          >
            📤 Upload File
          </button>
          <button
            className={`${styles.tab} ${method === "blank" ? styles.active : ""}`}
            onClick={() => setMethod("blank")}
          >
            📄 Blank File
          </button>
          <button
            className={`${styles.tab} ${method === "template" ? styles.active : ""}`}
            onClick={() => setMethod("template")}
          >
            📋 Template
          </button>
          <button
            className={`${styles.tab} ${method === "url" ? styles.active : ""}`}
            onClick={() => setMethod("url")}
          >
            🌐 From URL
          </button>
        </div>

        <div className={styles.content}>
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

          {/* Upload File */}
          {method === "upload" && (
            <div className={styles.section}>
              <div className={styles.uploadArea}>
                <input
                  type="file"
                  accept=".md,.markdown,.txt"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className={styles.fileInput}
                  id="file-upload"
                />
                <label htmlFor="file-upload" className={styles.uploadLabel}>
                  {uploadFile ? (
                    <div>
                      <p>✓ Selected: {uploadFile.name}</p>
                      <p className={styles.uploadHint}>Click to change file</p>
                    </div>
                  ) : (
                    <div>
                      <p>📁 Click to select .md file</p>
                      <p className={styles.uploadHint}>or drag and drop</p>
                    </div>
                  )}
                </label>
              </div>
            </div>
          )}

          {/* Blank File */}
          {method === "blank" && (
            <div className={styles.section}>
              <label className={styles.label}>
                File Name
                <input
                  type="text"
                  className={styles.input}
                  placeholder="untitled.md"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  autoFocus
                />
              </label>
              <p className={styles.hint}>Creates an empty markdown file ready for editing</p>
            </div>
          )}

          {/* Template */}
          {method === "template" && (
            <div className={styles.section}>
              <label className={styles.label}>
                Choose Template
                <select
                  className={styles.select}
                  value={selectedTemplate}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  autoFocus
                >
                  <option value="">Select a template...</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </label>
              {selectedTemplate && (
                <>
                  <label className={styles.label}>
                    File Name
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="filename.md"
                      value={fileName}
                      onChange={(e) => setFileName(e.target.value)}
                    />
                  </label>
                  <label className={styles.label}>
                    Preview
                    <textarea
                      className={styles.textarea}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={8}
                    />
                  </label>
                </>
              )}
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
            disabled={loading || (method === "upload" && !uploadFile) || (method === "template" && !selectedTemplate)}
          >
            {loading ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
