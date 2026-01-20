import { useEffect, useState, useRef } from "react";
import FileCard from "../FileCard/FileCard";
import styles from "./FileFlowChart.module.css";

interface FileData {
  id: string;
  name: string;
  path: string;
  metadata: { size: number };
}

interface Connection {
  from: string;
  to: string;
}

interface FileFlowChartProps {
  files: FileData[];
  onFileSelect?: (fileId: string) => void;
  onConnectionCreate?: (from: string, to: string) => void;
}

export default function FileFlowChart({
  files,
  onFileSelect,
  onConnectionCreate,
}: FileFlowChartProps) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [cardPositions, setCardPositions] = useState<
    Record<string, { x: number; y: number; width: number; height: number }>
  >({});

  // Update card positions for connection lines
  useEffect(() => {
    const updatePositions = () => {
      if (containerRef.current) {
        const newPositions: typeof cardPositions = {};
        const cards = containerRef.current.querySelectorAll("[data-file-id]");

        cards.forEach((card) => {
          const fileId = card.getAttribute("data-file-id");
          const rect = card.getBoundingClientRect();
          const containerRect = containerRef.current!.getBoundingClientRect();

          if (fileId) {
            newPositions[fileId] = {
              x: rect.left - containerRect.left,
              y: rect.top - containerRect.top,
              width: rect.width,
              height: rect.height,
            };
          }
        });

        setCardPositions(newPositions);
      }
    };

    updatePositions();
    window.addEventListener("resize", updatePositions);
    return () => window.removeEventListener("resize", updatePositions);
  }, [files]);

  const handleConnect = (fromFileId: string, toFileId: string) => {
    // Check if connection already exists
    const exists = connections.some(
      (c) => c.from === fromFileId && c.to === toFileId
    );
    if (!exists) {
      const newConnection = { from: fromFileId, to: toFileId };
      setConnections([...connections, newConnection]);
      onConnectionCreate?.(fromFileId, toFileId);
    }
  };

  const removeConnection = (from: string, to: string) => {
    setConnections(connections.filter((c) => !(c.from === from && c.to === to)));
  };

  // Draw connection lines
  const drawConnectionLines = () => {
    const lines = connections.map((conn) => {
      const fromPos = cardPositions[conn.from];
      const toPos = cardPositions[conn.to];

      if (!fromPos || !toPos) return null;

      // Calculate connection points (center of cards)
      const x1 = fromPos.x + fromPos.width / 2;
      const y1 = fromPos.y + fromPos.height / 2;
      const x2 = toPos.x + toPos.width / 2;
      const y2 = toPos.y + toPos.height / 2;

      // Calculate arrow angle
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const arrowSize = 8;
      const arrowX = x2 - arrowSize * Math.cos(angle);
      const arrowY = y2 - arrowSize * Math.sin(angle);

      return (
        <g key={`${conn.from}-${conn.to}`}>
          {/* Connection line */}
          <line
            x1={x1}
            y1={y1}
            x2={arrowX}
            y2={arrowY}
            className={styles.connectionLine}
            onMouseEnter={(e) => e.currentTarget.classList.add(styles.hovered)}
            onMouseLeave={(e) =>
              e.currentTarget.classList.remove(styles.hovered)
            }
            onClick={() => removeConnection(conn.from, conn.to)}
            style={{ cursor: "pointer" }}
          />

          {/* Arrow head */}
          <polygon
            points={`${x2},${y2} ${x2 - arrowSize * Math.cos(angle - 0.3)},${
              y2 - arrowSize * Math.sin(angle - 0.3)
            } ${x2 - arrowSize * Math.cos(angle + 0.3)},${
              y2 - arrowSize * Math.sin(angle + 0.3)
            }`}
            className={styles.arrowHead}
          />
        </g>
      );
    });

    return lines.filter(Boolean);
  };

  return (
    <div className={styles.container} ref={containerRef}>
      <div className={styles.header}>
        <h2>File Flow Chart</h2>
        <p className={styles.instructions}>
          Click files to select • Click "Connect +" to create links • Click lines to remove links
        </p>
      </div>

      {/* SVG Layer for connection lines */}
      <svg className={styles.svg}>
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="#667eea" />
          </marker>
        </defs>
        {drawConnectionLines()}
      </svg>

      {/* Cards Grid */}
      <div className={styles.grid}>
        {files.map((file) => (
          <div key={file.id} data-file-id={file.id}>
            <FileCard
              id={file.id}
              name={file.name}
              path={file.path}
              size={file.metadata.size}
              isSelected={selectedFile === file.id}
              onSelect={(fileId) => {
                setSelectedFile(fileId);
                onFileSelect?.(fileId);
              }}
              onConnect={handleConnect}
              allFiles={files}
              connections={{
                linksTo: connections
                  .filter((c) => c.from === file.id)
                  .map((c) => c.to),
                linkedFrom: connections
                  .filter((c) => c.to === file.id)
                  .map((c) => c.from),
              }}
            />
          </div>
        ))}
      </div>

      {files.length === 0 && (
        <div className={styles.empty}>No files to display</div>
      )}

      {/* Connection Counter */}
      <div className={styles.footer}>
        <p>
          Total Connections: <strong>{connections.length}</strong>
        </p>
      </div>
    </div>
  );
}
