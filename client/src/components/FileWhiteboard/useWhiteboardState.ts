import { useEffect, useState, useCallback, useRef } from "react";
import { ForceDirectedGraph, Edge } from "./ForceDirectedGraph";

export interface FileData {
  id: string;
  name: string;
  path: string;
  metadata: { size: number };
  contentPreview?: string;
}

// Strip markdown syntax for clean preview text
function stripMarkdown(text: string): string {
  return text
    // Remove headers
    .replace(/^#{1,6}\s+/gm, "")
    // Remove bold/italic
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    // Remove inline code
    .replace(/`([^`]+)`/g, "$1")
    // Remove links, keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Remove images
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "")
    // Remove blockquotes
    .replace(/^>\s+/gm, "")
    // Remove horizontal rules
    .replace(/^[-*_]{3,}\s*$/gm, "")
    // Remove list markers
    .replace(/^[\s]*[-*+]\s+/gm, "")
    .replace(/^[\s]*\d+\.\s+/gm, "")
    // Collapse multiple newlines
    .replace(/\n{2,}/g, " ")
    // Collapse multiple spaces
    .replace(/\s{2,}/g, " ")
    .trim();
}

export interface Connection {
  from: string;
  to: string;
  linkText?: string;
  lineNumber?: number;
}

export interface CardPosition {
  x: number;
  y: number;
}

export interface BacklinkInfo {
  linkedFrom: Array<{ fileId: string; fileName: string; context: string }>;
  linksTo: Array<{ fileId: string; fileName: string; context: string }>;
}

interface WhiteboardState {
  files: FileData[];
  filesWithPreviews: FileData[];
  connections: Connection[];
  positions: Record<string, CardPosition>;
  selectedFile: string | null;
  hoveredFile: string | null;
  loading: boolean;
  error: string | null;
}

const STORAGE_KEY_PREFIX = "whiteboard_positions_";

export function useWhiteboardState(
  files: FileData[],
  folderPath: string,
  containerRef: React.RefObject<HTMLDivElement>
) {
  const [state, setState] = useState<WhiteboardState>({
    files,
    filesWithPreviews: files,
    connections: [],
    positions: {},
    selectedFile: null,
    hoveredFile: null,
    loading: true,
    error: null,
  });

  const graphRef = useRef<ForceDirectedGraph | null>(null);

  // Load saved positions from localStorage
  const loadSavedPositions = useCallback(() => {
    const storageKey = `${STORAGE_KEY_PREFIX}${folderPath}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {};
      }
    }
    return {};
  }, [folderPath]);

  // Save positions to localStorage
  const savePositions = useCallback(
    (positions: Record<string, CardPosition>) => {
      const storageKey = `${STORAGE_KEY_PREFIX}${folderPath}`;
      localStorage.setItem(storageKey, JSON.stringify(positions));
    },
    [folderPath]
  );

  // Fetch backlinks for all files
  const fetchBacklinks = useCallback(async () => {
    if (!files.length) {
      setState((prev) => ({
        ...prev,
        loading: false,
        connections: [],
      }));
      return;
    }

    try {
      const allConnections: Connection[] = [];
      const backlinksMap = new Map<string, BacklinkInfo>();

      // Fetch backlinks for each file
      for (const file of files) {
        try {
          const response = await fetch(`/api/backlinks/${file.id}`);
          if (response.ok) {
            const backlinks: BacklinkInfo = await response.json();
            backlinksMap.set(file.id, backlinks);

            // Create connections from linksTo (this file links to others)
            backlinks.linksTo.forEach((link) => {
              allConnections.push({
                from: file.id,
                to: link.fileId,
                linkText: link.context,
              });
            });
          }
        } catch (error) {
          console.warn(`Failed to fetch backlinks for ${file.id}:`, error);
        }
      }

      // Remove duplicate connections
      const uniqueConnections = Array.from(
        new Map(
          allConnections.map((c) => [`${c.from}-${c.to}`, c])
        ).values()
      );

      setState((prev) => ({
        ...prev,
        connections: uniqueConnections,
        loading: false,
      }));
    } catch (error) {
      console.error("Failed to fetch backlinks:", error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Failed to load connections",
      }));
    }
  }, [files]);

  // Initialize graph layout
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = Math.max(container.clientWidth, 800);
    const height = Math.max(container.clientHeight, 600);

    console.log("[FileWhiteboard] Initializing layout with dimensions:", width, height);

    // Create force-directed graph with parameters tuned for larger cards
    graphRef.current = new ForceDirectedGraph(width, height, {
      linkStrength: 0.08,
      repulsionStrength: 400, // Increased for larger cards (280x160px)
      centerGravity: 0.02,
      damping: 0.85,
      maxVelocity: 4,
    });

    // Add nodes
    const nodeIds = files.map((f) => f.id);
    graphRef.current.addNodes(nodeIds);

    // Restore saved positions if available
    const savedPositions = loadSavedPositions();
    nodeIds.forEach((id) => {
      if (savedPositions[id]) {
        graphRef.current!.setNodePosition(
          id,
          savedPositions[id].x,
          savedPositions[id].y
        );
      }
    });

    const initialPositions = graphRef.current!.getPositions();
    console.log("[FileWhiteboard] Initial positions:", initialPositions);

    setState((prev) => ({
      ...prev,
      positions: initialPositions,
    }));
  }, [files, loadSavedPositions]);

  // Run force simulation after connections are loaded
  useEffect(() => {
    if (state.connections.length === 0 || !graphRef.current) return;

    // Convert connections to graph edges
    const edges: Edge[] = state.connections.map((c) => ({
      source: c.from,
      target: c.to,
    }));

    graphRef.current.setEdges(edges);

    // Run simulation
    graphRef.current.simulate(100);

    const newPositions = graphRef.current.getPositions();
    setState((prev) => ({
      ...prev,
      positions: newPositions,
    }));

    // Save to localStorage
    savePositions(newPositions);
  }, [state.connections, savePositions]);

  // Initial fetch of backlinks
  useEffect(() => {
    fetchBacklinks();
  }, [fetchBacklinks]);

  // Fetch content previews for all files
  const fetchContentPreviews = useCallback(async () => {
    if (!files.length) return;

    const PREVIEW_LENGTH = 120;
    const BATCH_SIZE = 10; // Fetch in batches to avoid overwhelming the server

    const previewCache = new Map<string, string>();

    // Process files in batches
    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      const batch = files.slice(i, i + BATCH_SIZE);

      const previewPromises = batch.map(async (file) => {
        // Only fetch previews for markdown files
        if (!file.name.endsWith(".md")) {
          return { id: file.id, preview: "" };
        }

        try {
          const response = await fetch(`/api/files/${file.id}/content`);
          if (response.ok) {
            const content = await response.text();
            // Extract first 300 chars and strip markdown
            const cleanContent = stripMarkdown(content.slice(0, 300));
            const preview = cleanContent.slice(0, PREVIEW_LENGTH);
            return {
              id: file.id,
              preview: preview.length < cleanContent.length ? preview + "..." : preview,
            };
          }
        } catch (error) {
          console.warn(`Failed to fetch preview for ${file.id}:`, error);
        }
        return { id: file.id, preview: "" };
      });

      const results = await Promise.all(previewPromises);
      results.forEach(({ id, preview }) => {
        previewCache.set(id, preview);
      });
    }

    // Update files with previews
    const updatedFiles = files.map((file) => ({
      ...file,
      contentPreview: previewCache.get(file.id) || "",
    }));

    setState((prev) => ({
      ...prev,
      filesWithPreviews: updatedFiles,
    }));
  }, [files]);

  // Fetch content previews after initial load
  useEffect(() => {
    fetchContentPreviews();
  }, [fetchContentPreviews]);

  // Handle container resize
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !graphRef.current) return;

      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      // Recreate graph with new dimensions
      const oldPositions = graphRef.current.getPositions();
      graphRef.current = new ForceDirectedGraph(width, height);
      graphRef.current.addNodes(files.map((f) => f.id));

      // Restore positions
      Object.entries(oldPositions).forEach(([id, pos]) => {
        graphRef.current!.setNodePosition(id, pos.x, pos.y);
      });

      graphRef.current.setEdges(
        state.connections.map((c) => ({
          source: c.from,
          target: c.to,
        }))
      );
    };

    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [files, state.connections]);

  const updateNodePosition = useCallback(
    (nodeId: string, x: number, y: number) => {
      if (!graphRef.current) return;

      graphRef.current.setNodePosition(nodeId, x, y);
      const newPositions = graphRef.current.getPositions();

      setState((prev) => ({
        ...prev,
        positions: newPositions,
      }));

      savePositions(newPositions);
    },
    [savePositions]
  );

  const setSelectedFile = useCallback((fileId: string | null) => {
    setState((prev) => ({
      ...prev,
      selectedFile: fileId,
    }));
  }, []);

  const setHoveredFile = useCallback((fileId: string | null) => {
    setState((prev) => ({
      ...prev,
      hoveredFile: fileId,
    }));
  }, []);

  const getConnectedFiles = useCallback(
    (fileId: string) => {
      const connected = new Set<string>();
      state.connections.forEach((conn) => {
        if (conn.from === fileId) connected.add(conn.to);
        if (conn.to === fileId) connected.add(conn.from);
      });
      return connected;
    },
    [state.connections]
  );

  const getConnectionsBetween = useCallback(
    (fileId: string) => {
      return state.connections.filter(
        (conn) => conn.from === fileId || conn.to === fileId
      );
    },
    [state.connections]
  );

  const getConnectionStrength = useCallback(
    (fileId: string) => {
      let count = 0;
      state.connections.forEach((conn) => {
        if (conn.from === fileId || conn.to === fileId) count++;
      });
      return count;
    },
    [state.connections]
  );

  return {
    state,
    updateNodePosition,
    setSelectedFile,
    setHoveredFile,
    getConnectedFiles,
    getConnectionsBetween,
    getConnectionStrength,
  };
}
