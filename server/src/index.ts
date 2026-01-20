import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { createServer } from "http";
import { Server } from "socket.io";
import routes from "./routes/index.js";
import { watchFiles } from "./utils/fileWatcher.js";
import { setCurrentFolder } from "./controllers/fileController.js";
import { setCurrentFolderForBacklinks } from "./controllers/backlinkController.js";
import { setCurrentFolderForSearch } from "./controllers/searchController.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Store config
let markdownFolderPath: string | null = null;

// Routes
app.use("/api", routes);

// Config endpoint
app.post("/api/config", (req, res) => {
  const { markdownFolderPath: path } = req.body;
  if (!path) {
    return res.status(400).json({ error: "Missing markdownFolderPath" });
  }
  markdownFolderPath = path;
  setCurrentFolder(path);
  setCurrentFolderForBacklinks(path);
  setCurrentFolderForSearch(path);

  // Start file watcher
  watchFiles(path, io);

  res.json({ success: true, path });
});

app.get("/api/config", (req, res) => {
  res.json({ markdownFolderPath });
});

// WebSocket connection
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
