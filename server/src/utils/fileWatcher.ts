import chokidar from "chokidar";
import { Server } from "socket.io";
import { basename } from "path";
import { clearCache } from "../services/fileService.js";

let watcher: chokidar.FSWatcher | null = null;

export function watchFiles(folderPath: string, io: Server) {
  // Stop existing watcher
  if (watcher) {
    watcher.close();
  }

  watcher = chokidar.watch(folderPath, {
    ignored: /(^|[\/\\])\.|node_modules/,
    awaitWriteFinish: {
      stabilityThreshold: 1000,
      pollInterval: 100,
    },
    persistent: true,
  });

  watcher
    .on("add", (filePath) => {
      if (filePath.endsWith(".md")) {
        clearCache();
        io.emit("file:added", {
          name: basename(filePath),
          path: filePath,
        });
      }
    })
    .on("change", (filePath) => {
      if (filePath.endsWith(".md")) {
        clearCache();
        io.emit("file:modified", {
          name: basename(filePath),
          path: filePath,
        });
      }
    })
    .on("unlink", (filePath) => {
      if (filePath.endsWith(".md")) {
        clearCache();
        io.emit("file:deleted", {
          name: basename(filePath),
          path: filePath,
        });
      }
    })
    .on("error", (error) => {
      console.error("File watcher error:", error);
    });

  console.log(`Watching files in ${folderPath}`);
}

export function stopWatching() {
  if (watcher) {
    watcher.close();
    watcher = null;
  }
}
