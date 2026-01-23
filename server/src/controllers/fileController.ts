import { Request, Response } from "express";
import { scanMarkdownFiles, getFileContent, createFile, updateFile, deleteFile } from "../services/fileService.js";

let currentFolderPath: string | null = null;
let singleFileFilter: string | null = null;

export function setCurrentFolder(path: string) {
  currentFolderPath = path;
}

export function setSingleFileFilter(fileName: string | null) {
  singleFileFilter = fileName;
}

export async function listFiles(req: Request, res: Response) {
  if (!currentFolderPath) {
    return res.status(400).json({ error: "No folder configured" });
  }

  try {
    let files = await scanMarkdownFiles(currentFolderPath);

    // Filter to single file if specified
    if (singleFileFilter) {
      const filterName = singleFileFilter;
      files = files.filter(f =>
        f.name === filterName ||
        f.id === filterName ||
        f.path.endsWith(filterName)
      );
    }

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

export async function createFileHandler(req: Request, res: Response) {
  const { fileName, content = "", folder = "" } = req.body;

  if (!currentFolderPath) {
    return res.status(400).json({ error: "No folder configured" });
  }

  if (!fileName) {
    return res.status(400).json({ error: "Missing fileName" });
  }

  try {
    const result = await createFile(currentFolderPath, fileName, content, folder);

    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }

    res.status(201).json({
      success: true,
      fileId: result.fileId,
      message: result.message,
    });
  } catch (error) {
    console.error("Error creating file:", error);
    res.status(500).json({ error: "Failed to create file" });
  }
}

export async function updateFileHandler(req: Request, res: Response) {
  const { fileId } = req.params;
  const { content } = req.body;

  if (!currentFolderPath) {
    return res.status(400).json({ error: "No folder configured" });
  }

  if (!fileId) {
    return res.status(400).json({ error: "Missing fileId" });
  }

  if (content === undefined) {
    return res.status(400).json({ error: "Missing content" });
  }

  try {
    const result = await updateFile(currentFolderPath, fileId, content);

    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("Error updating file:", error);
    res.status(500).json({ error: "Failed to update file" });
  }
}

export async function deleteFileHandler(req: Request, res: Response) {
  const { fileId } = req.params;

  if (!currentFolderPath) {
    return res.status(400).json({ error: "No folder configured" });
  }

  if (!fileId) {
    return res.status(400).json({ error: "Missing fileId" });
  }

  try {
    const result = await deleteFile(currentFolderPath, fileId);

    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("Error deleting file:", error);
    res.status(500).json({ error: "Failed to delete file" });
  }
}
