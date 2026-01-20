import styles from "./FileWhiteboard.module.css";
import { CardPosition } from "./useWhiteboardState";

export interface FileData {
  id: string;
  name: string;
  path: string;
  metadata: { size: number };
  contentPreview?: string;
}

interface WhiteboardCardProps {
  file: FileData;
  position: CardPosition;
  isSelected: boolean;
  isHovered: boolean;
  connectionCount: number;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
}

export default function WhiteboardCard({
  file,
  position,
  isSelected,
  isHovered,
  connectionCount,
  onMouseDown,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: WhiteboardCardProps) {
  // Determine color based on connection strength
  const getConnectionColor = () => {
    if (connectionCount >= 5) return "#e74c3c"; // Red - highly connected
    if (connectionCount >= 3) return "#f39c12"; // Orange - well connected
    if (connectionCount >= 1) return "#667eea"; // Indigo - connected
    return "#999"; // Gray - isolated
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <div
      className={`${styles.card} ${isSelected ? styles.selected : ""} ${
        isHovered ? styles.hovered : ""
      }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        borderLeftColor: getConnectionColor(),
      }}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      {/* Header section with file info */}
      <div className={styles.cardHeader}>
        <div className={styles.cardHeaderLeft}>
          <span className={styles.icon}>📄</span>
          <h4 className={styles.name} title={file.name}>
            {file.name}
          </h4>
        </div>
        <div className={styles.cardHeaderRight}>
          {connectionCount > 0 && (
            <div className={styles.connectionBadge} title={`${connectionCount} connections`}>
              {connectionCount}↔
            </div>
          )}
        </div>
      </div>

      {/* Content preview section */}
      <div className={styles.cardPreview}>
        {file.contentPreview ? (
          <p className={styles.previewText}>{file.contentPreview}</p>
        ) : (
          <p className={styles.previewPlaceholder}>
            <span className={styles.sizeInfo}>{formatFileSize(file.metadata.size)}</span>
          </p>
        )}
      </div>

      {/* Color indicator bar */}
      <div
        className={styles.connectionIndicator}
        style={{
          backgroundColor: getConnectionColor(),
          width: `${Math.min((connectionCount / 10) * 100, 100)}%`,
        }}
      />
    </div>
  );
}
