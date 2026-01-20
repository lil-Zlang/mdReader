import { useEffect, useState, useRef } from "react";
import styles from "./FileWhiteboard.module.css";
import WhiteboardCard from "./WhiteboardCard";
import ConnectionLine from "./ConnectionLine";
import { useWhiteboardState, FileData, CardPosition } from "./useWhiteboardState";

interface FileWhiteboardProps {
  files: FileData[];
  onFileSelect?: (fileId: string) => void;
  folderPath?: string;
}

// Minimum pixels moved to count as a drag (not a click)
const DRAG_THRESHOLD = 5;

export default function FileWhiteboard({
  files,
  onFileSelect,
  folderPath = "root",
}: FileWhiteboardProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const {
    state,
    updateNodePosition,
    setSelectedFile,
    setHoveredFile,
    getConnectedFiles,
    getConnectionsBetween,
    getConnectionStrength,
  } = useWhiteboardState(files, folderPath, canvasRef);
  const svgRef = useRef<SVGSVGElement>(null);
  const [draggingCard, setDraggingCard] = useState<string | null>(null);
  const [draggingStart, setDraggingStart] = useState<CardPosition | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [hoveredLine, setHoveredLine] = useState<string | null>(null);

  // Track if we actually dragged (to distinguish from click)
  const draggedRef = useRef(false);
  const mouseDownPosRef = useRef<CardPosition | null>(null);

  // Handle card drag
  const handleCardMouseDown = (fileId: string, e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    e.preventDefault();
    e.stopPropagation();
    setDraggingCard(fileId);
    setDraggingStart({ x: e.clientX, y: e.clientY });
    mouseDownPosRef.current = { x: e.clientX, y: e.clientY };
    draggedRef.current = false;
    setSelectedFile(fileId);
  };

  // Handle mouse move for dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (draggingCard && draggingStart && canvasRef.current) {
        const deltaX = (e.clientX - draggingStart.x) / zoom;
        const deltaY = (e.clientY - draggingStart.y) / zoom;

        // Check if we've moved enough to count as a drag
        if (mouseDownPosRef.current) {
          const totalDeltaX = Math.abs(e.clientX - mouseDownPosRef.current.x);
          const totalDeltaY = Math.abs(e.clientY - mouseDownPosRef.current.y);
          if (totalDeltaX > DRAG_THRESHOLD || totalDeltaY > DRAG_THRESHOLD) {
            draggedRef.current = true;
          }
        }

        const currentPos = state.positions[draggingCard] || { x: 0, y: 0 };

        updateNodePosition(
          draggingCard,
          currentPos.x + deltaX,
          currentPos.y + deltaY
        );

        setDraggingStart({ x: e.clientX, y: e.clientY });
      }
    };

    const handleMouseUp = () => {
      setDraggingCard(null);
      setDraggingStart(null);
      mouseDownPosRef.current = null;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    draggingCard,
    draggingStart,
    state.positions,
    updateNodePosition,
    zoom,
  ]);

  // Handle card click (only if not dragged)
  const handleCardClick = (fileId: string) => {
    if (draggedRef.current) {
      // Was a drag, not a click - reset and ignore
      draggedRef.current = false;
      return;
    }
    setSelectedFile(fileId);
    onFileSelect?.(fileId);
  };

  // Handle zoom with mouse wheel
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom((prev) => Math.max(0.1, Math.min(3, prev * delta)));
    }
  };

  // Handle pan with middle mouse button
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 2 || (e.button === 1 && !draggingCard)) {
      // Right-click or middle-click to pan
      e.preventDefault();
      const startX = e.clientX;
      const startY = e.clientY;
      const startPan = { ...pan };

      const handlePanMouseMove = (e: MouseEvent) => {
        setPan({
          x: startPan.x + (e.clientX - startX) / zoom,
          y: startPan.y + (e.clientY - startY) / zoom,
        });
      };

      const handlePanMouseUp = () => {
        document.removeEventListener("mousemove", handlePanMouseMove);
        document.removeEventListener("mouseup", handlePanMouseUp);
      };

      document.addEventListener("mousemove", handlePanMouseMove);
      document.addEventListener("mouseup", handlePanMouseUp);
    }
  };

  // Render connection lines
  const renderConnections = () => {
    if (state.loading || state.connections.length === 0) return null;

    return state.connections.map((conn, index) => {
      const fromPos = state.positions[conn.from];
      const toPos = state.positions[conn.to];

      if (!fromPos || !toPos) return null;

      const isHovered = hoveredLine === `${conn.from}-${conn.to}`;
      const connectedFiles = getConnectedFiles(state.hoveredFile || "");
      const isRelated =
        state.hoveredFile &&
        (connectedFiles.has(conn.from) || connectedFiles.has(conn.to));
      const connectionCount = getConnectionStrength(conn.from);

      return (
        <ConnectionLine
          key={`${conn.from}-${conn.to}`}
          connection={conn}
          fromPosition={fromPos}
          toPosition={toPos}
          isHovered={isHovered}
          isRelated={isRelated || false}
          connectionCount={connectionCount}
          connectionIndex={index}
          onHover={(hovered) => {
            setHoveredLine(hovered ? `${conn.from}-${conn.to}` : null);
          }}
        />
      );
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Knowledge Graph</h2>
        <p className={styles.instructions}>
          Files auto-connect based on links • Drag to rearrange • Scroll + Ctrl to zoom •
          Right-click to pan
        </p>
      </div>

      <div
        className={styles.whiteboard}
        ref={canvasRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onContextMenu={(e) => e.preventDefault()}
      >
        {state.loading && (
          <div className={styles.loadingOverlay}>
            <p>Loading connections...</p>
          </div>
        )}

        <svg
          ref={svgRef}
          className={styles.svg}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
          }}
        >
          {renderConnections()}
        </svg>

        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
            zIndex: 10,
            pointerEvents: "none",
          }}
        >
          {state.filesWithPreviews.map((file) => {
            const pos = state.positions[file.id];
            if (!pos) return null;

            const connectionCount = getConnectionStrength(file.id);

            return (
              <WhiteboardCard
                key={file.id}
                file={file}
                position={pos}
                isSelected={state.selectedFile === file.id}
                isHovered={state.hoveredFile === file.id}
                connectionCount={connectionCount}
                onMouseDown={(e) => handleCardMouseDown(file.id, e)}
                onMouseEnter={() => setHoveredFile(file.id)}
                onMouseLeave={() => setHoveredFile(null)}
                onClick={() => handleCardClick(file.id)}
              />
            );
          })}
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.stats}>
          <span>Files: <strong>{files.length}</strong></span>
          <span>Connections: <strong>{state.connections.length}</strong></span>
          <span>Zoom: <strong>{(zoom * 100).toFixed(0)}%</strong></span>
        </div>
        <p className={styles.hint}>
          💡 Auto-detected connections based on file links • Click card to view file
        </p>
      </div>
    </div>
  );
}
