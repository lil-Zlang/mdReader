import { Router } from "express";
import { listFiles, getFile } from "../controllers/fileController.js";
import { getFileBacklinks } from "../controllers/backlinkController.js";
import { searchFiles } from "../controllers/searchController.js";

const router = Router();

router.get("/files", listFiles);
router.get("/files/:fileId", getFile);
router.get("/backlinks/:fileId", getFileBacklinks);
router.get("/search", searchFiles);

export default router;
