import { Router } from "express";
import {
  createPackageType,
  getAllPackageTypes,
  getPackageTypeById,
  updatePackageType,
  deletePackageType,
  getPackageTypeFilteringValues,
} from "../controllers/package-types.controller";

const router = Router();

router.post("/", createPackageType);
router.get("/", getAllPackageTypes);
router.get("/filtering-values", getPackageTypeFilteringValues);
router.get("/:id", getPackageTypeById);
router.put("/:id", updatePackageType);
router.delete("/:id", deletePackageType);

export default router;
