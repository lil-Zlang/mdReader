import { useEffect, useState, useCallback, useRef } from "react";
import { ForceDirectedGraph, Edge } from "./ForceDirectedGraph";

export interface FileData {
  id: string;
  name: string;
  path: string;
  metadata: { size: number };
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

    // Create force-directed graph
    graphRef.current = new ForceDirectedGraph(width, height, {
      linkStrength: 0.08,
      repulsionStrength: 250,
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
