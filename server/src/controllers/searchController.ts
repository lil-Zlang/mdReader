import { Request, Response } from "express";
import { search } from "../services/searchService.js";

let currentFolderPath: string | null = null;

export function setCurrentFolderForSearch(path: string) {
  currentFolderPath = path;
}

export async function searchFiles(req: Request, res: Response) {
  const { q, limit } = req.query;

  if (!currentFolderPath) {
    return res.status(400).json({ error: "No folder configured" });
  }

  if (!q || typeof q !== "string") {
    return res.status(400).json({ error: "Missing search query" });
  }

  try {
    const searchLimit = limit ? parseInt(limit as string, 10) : 50;
    const results = await search(currentFolderPath, q, searchLimit);
    res.json(results);
  } catch (error) {
    console.error("Error searching:", error);
    res.status(500).json({ error: "Search failed" });
  }
}
