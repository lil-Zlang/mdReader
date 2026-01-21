import { Router } from "express";
import { listFiles, getFile, createFileHandler, updateFileHandler, deleteFileHandler } from "../controllers/fileController.js";
import { getFileBacklinks } from "../controllers/backlinkController.js";
import { searchFiles } from "../controllers/searchController.js";

const router = Router();

router.get("/files", listFiles);
router.post("/files", createFileHandler);
router.get("/files/:fileId", getFile);
router.put("/files/:fileId", updateFileHandler);
router.delete("/files/:fileId", deleteFileHandler);
router.get("/backlinks/:fileId", getFileBacklinks);
router.get("/search", searchFiles);

export default router;
