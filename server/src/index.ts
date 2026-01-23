import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createHttpServer } from "http";
import { Server } from "socket.io";
import routes from "./routes/index.js";
import { watchFiles } from "./utils/fileWatcher.js";
import { setCurrentFolder, setSingleFileFilter } from "./controllers/fileController.js";
import { setCurrentFolderForBacklinks } from "./controllers/backlinkController.js";
import { setCurrentFolderForSearch } from "./controllers/searchController.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface ServerOptions {
  port: number;
  folderPath: string;
  clientPath?: string;
  singleFile?: string; // When set, only serve this specific file
}

export interface ServerInstance {
  close: (callback?: () => void) => void;
  port: number;
}

export async function createServer(options: ServerOptions): Promise<ServerInstance> {
  const { port, folderPath, clientPath, singleFile } = options;

  const app = express();
  const httpServer = createHttpServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Set folder path for all controllers
  setCurrentFolder(folderPath);
  setCurrentFolderForBacklinks(folderPath);
  setCurrentFolderForSearch(folderPath);

  // Set single file filter if specified
  if (singleFile) {
    setSingleFileFilter(singleFile);
  }

  // Start file watcher
  watchFiles(folderPath, io);

  // API routes
  app.use("/api", routes);

  // Config endpoint (for compatibility)
  app.get("/api/config", (_req, res) => {
    res.json({ markdownFolderPath: folderPath });
  });

  // Serve static client files if clientPath provided
  if (clientPath) {
    app.use(express.static(clientPath));

    // SPA fallback - serve index.html for all non-API routes
    app.get("*", (_req, res) => {
      res.sendFile(path.join(clientPath, "index.html"));
    });
  }

  // WebSocket connection (silent - no logging)
  io.on("connection", () => {
    // Connection established
  });

  // Start server
  return new Promise((resolve) => {
    httpServer.listen(port, () => {
      resolve({
        close: (callback?: () => void) => {
          io.close();
          httpServer.close(callback);
        },
        port,
      });
    });
  });
}

// Run directly if this is the main module
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const PORT = parseInt(process.env.PORT || "3001", 10);
  const FOLDER = process.env.MARKDOWN_FOLDER || process.cwd();

  createServer({ port: PORT, folderPath: FOLDER }).then((server) => {
    console.log(`Server running on http://localhost:${server.port}`);
    console.log(`Serving markdown files from: ${FOLDER}`);
  });
}
