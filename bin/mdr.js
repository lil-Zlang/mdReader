#!/usr/bin/env node

import path from "path";
import fs from "fs";
import fsp from "fs/promises";
import { fileURLToPath } from "url";
import express from "express";
import open from "open";
import getPort from "get-port";
import fg from "fast-glob";
import { program } from "commander";
import { marked } from "marked";
import hljs from "highlight.js";
import TurndownService from "turndown";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function normalizeToPosix(filePath) {
  return filePath.split(path.sep).join("/");
}

function resolveSafePath(root, target) {
  const safeTarget = target.replace(/^\/+/, "");
  const resolvedRoot = path.resolve(root);
  const resolvedTarget = path.resolve(resolvedRoot, safeTarget);
  if (resolvedTarget === resolvedRoot) {
    return resolvedTarget;
  }
  if (!resolvedTarget.startsWith(resolvedRoot + path.sep)) {
    throw new Error("Invalid file path");
  }
  return resolvedTarget;
}

marked.setOptions({
  gfm: true,
  breaks: false,
  highlight: (code, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  },
});

const turndownService = new TurndownService({
  codeBlockStyle: "fenced",
  headingStyle: "atx",
  bulletListMarker: "-",
});

async function scanFiles(folderPath) {
  const entries = await fg(["**/*.{md,markdown,txt}"], {
    cwd: folderPath,
    onlyFiles: true,
    caseSensitiveMatch: false,
    ignore: ["**/node_modules/**"],
  });

  const files = await Promise.all(
    entries.map(async (relativePath) => {
      const fullPath = path.join(folderPath, relativePath);
      const stats = await fsp.stat(fullPath);
      const relativePosix = normalizeToPosix(relativePath);
      return {
        id: relativePosix,
        name: path.basename(relativePosix),
        path: fullPath,
        relativePath: relativePosix,
        metadata: {
          size: stats.size,
          modifiedAt: stats.mtime,
          createdAt: stats.birthtime,
        },
      };
    })
  );

  files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  return files;
}

async function ensureSingleFileEntry(folderPath, singleFile) {
  try {
    const stats = await fsp.stat(singleFile.absolutePath);
    const relativePath = normalizeToPosix(
      path.relative(folderPath, singleFile.absolutePath)
    );
    return {
      id: relativePath,
      name: singleFile.name,
      path: singleFile.absolutePath,
      relativePath,
      metadata: {
        size: stats.size,
        modifiedAt: stats.mtime,
        createdAt: stats.birthtime,
      },
    };
  } catch {
    return null;
  }
}

function applySingleFileFilter(files, singleFile) {
  if (!singleFile) {
    return files;
  }
  const filtered = files.filter((file) => {
    return (
      file.name === singleFile.name ||
      file.relativePath === singleFile.relativePath ||
      file.path === singleFile.absolutePath ||
      file.relativePath.endsWith("/" + singleFile.name) ||
      file.relativePath === singleFile.name
    );
  });
  return filtered;
}

async function createServer(options) {
  const { folderPath, singleFile, initialFile } = options;
  const app = express();

  app.use(express.json({ limit: "2mb" }));

  app.get("/api/config", (_req, res) => {
    res.json({
      folderPath,
      singleFile: singleFile ? singleFile.relativePath : null,
      initialFile: initialFile || null,
    });
  });

  app.get("/api/files", async (_req, res) => {
    try {
      let files = await scanFiles(folderPath);
      if (singleFile) {
        files = applySingleFileFilter(files, singleFile);
        if (files.length === 0) {
          const entry = await ensureSingleFileEntry(folderPath, singleFile);
          if (entry) {
            files = [entry];
          }
        }
      }
      res.json(files);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to list files" });
    }
  });

  app.get("/api/file", async (req, res) => {
    const fileId = req.query.path;
    if (!fileId || typeof fileId !== "string") {
      return res.status(400).json({ error: "Missing file path" });
    }

    try {
      const safePath = resolveSafePath(folderPath, fileId);
      const content = await fsp.readFile(safePath, "utf-8");
      const stats = await fsp.stat(safePath);
      const html = marked.parse(content);

      res.json({
        content,
        html,
        metadata: {
          size: stats.size,
          modifiedAt: stats.mtime,
          createdAt: stats.birthtime,
        },
      });
    } catch (error) {
      res.status(404).json({ error: error instanceof Error ? error.message : "File not found" });
    }
  });

  app.put("/api/file", async (req, res) => {
    const fileId = req.query.path;
    const { content, html } = req.body || {};
    if (!fileId || typeof fileId !== "string") {
      return res.status(400).json({ error: "Missing file path" });
    }

    let finalContent = content;
    if (typeof html === "string") {
      finalContent = turndownService.turndown(html);
    }
    if (typeof finalContent !== "string") {
      return res.status(400).json({ error: "Missing content" });
    }

    try {
      const safePath = resolveSafePath(folderPath, fileId);
      await fsp.writeFile(safePath, finalContent, "utf-8");
      const stats = await fsp.stat(safePath);
      const renderedHtml = marked.parse(finalContent);

      res.json({
        content: finalContent,
        html: renderedHtml,
        metadata: {
          size: stats.size,
          modifiedAt: stats.mtime,
          createdAt: stats.birthtime,
        },
      });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to save file" });
    }
  });

  app.post("/api/render", async (req, res) => {
    const { content } = req.body || {};
    if (typeof content !== "string") {
      return res.status(400).json({ error: "Missing content" });
    }
    try {
      const html = marked.parse(content);
      res.json({ html });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to render markdown" });
    }
  });

  app.use(express.static(path.join(__dirname, "..", "public")));

  app.get("*", (_req, res) => {
    res.sendFile(path.join(__dirname, "..", "public", "index.html"));
  });

  return app;
}

program
  .name("mdr")
  .description("CLI-only Markdown reader")
  .argument("[path]", "Path to markdown file or folder", ".")
  .option("-p, --port <number>", "Port to run on (default: auto-detect)")
  .option("--no-open", "Don't open browser automatically")
  .action(async (inputPath, options) => {
    try {
      const resolvedPath = path.resolve(inputPath);

      if (!fs.existsSync(resolvedPath)) {
        console.error(`Error: Path does not exist: ${resolvedPath}`);
        process.exit(1);
      }

      const stats = fs.statSync(resolvedPath);
      let folderPath;
      let initialFile = null;
      let singleFile = null;

      if (stats.isDirectory()) {
        folderPath = resolvedPath;
      } else if (stats.isFile()) {
        folderPath = path.dirname(resolvedPath);
        initialFile = normalizeToPosix(path.relative(folderPath, resolvedPath));
        singleFile = {
          name: path.basename(resolvedPath),
          absolutePath: resolvedPath,
          relativePath: initialFile,
        };
      } else {
        console.error(`Error: Invalid path: ${resolvedPath}`);
        process.exit(1);
      }

      const port = options.port
        ? Number(options.port)
        : await getPort({ port: [3000, 3001, 3002, 3003, 3004, 3005] });

      const app = await createServer({ folderPath, singleFile, initialFile });
      const server = app.listen(port, () => {
        const url = new URL(`http://localhost:${port}`);
        if (initialFile) {
          url.searchParams.set("file", initialFile);
        }

        console.log(`mdr running at ${url.toString()}`);
        console.log(`Serving markdown from: ${folderPath}`);

        if (options.open) {
          open(url.toString());
        }
      });

      const shutdown = () => {
        server.close(() => process.exit(0));
      };

      process.on("SIGINT", shutdown);
      process.on("SIGTERM", shutdown);
    } catch (error) {
      console.error("Error:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse(process.argv);
