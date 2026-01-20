import { Request, Response } from "express";
import { scanMarkdownFiles, getFileContent } from "../services/fileService.js";

let currentFolderPath: string | null = null;

export function setCurrentFolder(path: string) {
  currentFolderPath = path;
}

export async function listFiles(req: Request, res: Response) {
  if (!currentFolderPath) {
    return res.status(400).json({ error: "No folder configured" });
  }

  try {
    const files = await scanMarkdownFiles(currentFolderPath);
    res.json(files);
  } catch (error) {
    console.error("Error listing files:", error);
    res.status(500).json({ error: "Failed to list files" });
  }
}

export async function getFile(req: Request, res: Response) {
  const { fileId } = req.params;

  if (!currentFolderPath) {
    return res.status(400).json({ error: "No folder configured" });
  }

  if (!fileId) {
    return res.status(400).json({ error: "Missing fileId" });
  }

  try {
    const result = await getFileContent(currentFolderPath, fileId);
    if (!result) {
      return res.status(404).json({ error: "File not found" });
    }
    res.json(result);
  } catch (error) {
    console.error("Error reading file:", error);
    res.status(500).json({ error: "Failed to read file" });
  }
}
