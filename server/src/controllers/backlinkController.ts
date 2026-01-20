import { Request, Response } from "express";
import { getBacklinks } from "../services/backlinkService.js";

let currentFolderPath: string | null = null;

export function setCurrentFolderForBacklinks(path: string) {
  currentFolderPath = path;
}

export async function getFileBacklinks(req: Request, res: Response) {
  const { fileId } = req.params;

  if (!currentFolderPath) {
    return res.status(400).json({ error: "No folder configured" });
  }

  if (!fileId) {
    return res.status(400).json({ error: "Missing fileId" });
  }

  try {
    const backlinks = await getBacklinks(currentFolderPath, fileId);
    res.json(backlinks);
  } catch (error) {
    console.error("Error getting backlinks:", error);
    res.status(500).json({ error: "Failed to get backlinks" });
  }
}
