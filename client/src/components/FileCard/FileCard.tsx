import { useState } from "react";
import styles from "./FileCard.module.css";

interface FileCardProps {
  id: string;
  name: string;
  path: string;
  size: number;
  isSelected?: boolean;
  onSelect?: (fileId: string) => void;
  onConnect?: (fromFileId: string, toFileId: string) => void;
  connections?: {
    linksTo: string[];
    linkedFrom: string[];
  };
  allFiles?: Array<{ id: string; name: string }>;
}

export default function FileCard({
  id,
  name,
  path,
  size,
  isSelected,
  onSelect,
  onConnect,
  connections,
  allFiles = [],
}: FileCardProps) {
  const [showConnectMenu, setShowConnectMenu] = useState(false);
  const [selectedConnectTo, setSelectedConnectTo] = useState<string | null>(null);

  const handleConnect = (targetFileId: string) => {
    onConnect?.(id, targetFileId);
    setShowConnectMenu(false);
    setSelectedConnectTo(targetFileId);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div
      className={`${styles.card} ${isSelected ? styles.selected : ""}`}
      onClick={() => onSelect?.(id)}
    >
      {/* Card Header */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h3 className={styles.title}>{name}</h3>
          <span className={styles.size}>{formatSize(size)}</span>
        </div>
        <span className={styles.icon}>📄</span>
      </div>

      {/* Card Body */}
      <div className={styles.body}>
        <p className={styles.path}>{path}</p>

        {/* Connections Summary */}
        {connections && (
          <div className={styles.connectionsSummary}>
            {connections.linksTo.length > 0 && (
              <div className={styles.connectionBadge}>
                <span className={styles.arrow}>→</span>
                <span className={styles.count}>{connections.linksTo.length}</span>
              </div>
            )}
            {connections.linkedFrom.length > 0 && (
              <div className={styles.connectionBadge}>
                <span className={styles.arrow}>←</span>
                <span className={styles.count}>{connections.linkedFrom.length}</span>
              </div>
            )}
            {connections.linksTo.length === 0 && connections.linkedFrom.length === 0 && (
              <p className={styles.noConnections}>No connections</p>
            )}
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className={styles.footer}>
        <button
          className={styles.actionButton}
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.(id);
          }}
          title="Open file"
        >
          Open
        </button>
        <div className={styles.connectDropdown}>
          <button
            className={styles.actionButton}
            onClick={(e) => {
              e.stopPropagation();
              setShowConnectMenu(!showConnectMenu);
            }}
            title="Create connection"
          >
            Connect +
          </button>
          {showConnectMenu && allFiles.length > 0 && (
            <div className={styles.menu}>
              <div className={styles.menuLabel}>Connect to:</div>
              {allFiles
                .filter((f) => f.id !== id)
                .slice(0, 5)
                .map((file) => (
                  <button
                    key={file.id}
                    className={styles.menuItem}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleConnect(file.id);
                    }}
                  >
                    {file.name}
                  </button>
                ))}
              {allFiles.length > 6 && (
                <div className={styles.menuLabel}>
                  +{allFiles.length - 5} more...
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
