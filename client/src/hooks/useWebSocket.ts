import { useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";

interface FileChangeEvent {
  type: "added" | "modified" | "deleted" | "renamed";
  name: string;
  path: string;
}

export function useWebSocket(onFileChange?: (event: FileChangeEvent) => void) {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Connect to WebSocket server
    const socket = io(window.location.origin, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      reconnectionAttempts: 3, // Limit reconnection attempts
      timeout: 5000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("WebSocket connected");
      setConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("WebSocket disconnected");
      setConnected(false);
    });

    // Listen for file events
    socket.on("file:added", (data) => {
      onFileChange?.({ type: "added", ...data });
    });

    socket.on("file:modified", (data) => {
      onFileChange?.({ type: "modified", ...data });
    });

    socket.on("file:deleted", (data) => {
      onFileChange?.({ type: "deleted", ...data });
    });

    socket.on("file:renamed", (data) => {
      onFileChange?.({ type: "renamed", ...data });
    });

    socket.on("error", (error) => {
      console.error("WebSocket error:", error);
    });

    socket.on("connect_error", () => {
      // Silently handle connection errors in production
      socket.disconnect();
    });

    return () => {
      socket.disconnect();
    };
  }, [onFileChange]);

  const emit = useCallback((event: string, data: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  return { connected, emit };
}
