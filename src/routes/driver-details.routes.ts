import { Router } from "express";
import multer from "multer";
import {
  createDriver,
  getAllDrivers,
  getDriverById,
  updateDriver,
  deleteDriver,
  linkTaxiRank,
  linkBankingDetails,
  linkTaxiAssociation,
  unlinkTaxiRank,
  unlinkBankingDetails,
  unlinkTaxiAssociation,
  uploadDriverIdDocument,
  uploadDriverOperatingPermit,
  uploadDriverLicenseDisk,
  uploadDriverPhoto,
  getDriverFilteringValues,
} from "../controllers/driver-details.controller";

const router = Router();

router.post("/", createDriver);
router.get("/", getAllDrivers);
router.get("/filtering-values", getDriverFilteringValues);
router.get("/:id", getDriverById);
router.put("/:id", updateDriver);
router.delete("/:id", deleteDriver);

// Multer memory storage (files written manually in controller for paths)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Linking endpoints
router.post("/link-rank", linkTaxiRank);
router.post("/link-banking", linkBankingDetails);
router.post("/link-association", linkTaxiAssociation);

// Unlinking endpoints
router.post("/unlink-rank", unlinkTaxiRank);
router.post("/unlink-banking", unlinkBankingDetails);
router.post("/unlink-association", unlinkTaxiAssociation);

// File upload endpoints
router.post("/:id/upload/id-document", upload.single("file"), uploadDriverIdDocument);
router.post("/:id/upload/operating-permit", upload.single("file"), uploadDriverOperatingPermit);
router.post("/:id/upload/license-disk", upload.single("file"), uploadDriverLicenseDisk);
router.post("/:id/upload/photo", upload.single("file"), uploadDriverPhoto);

export default router;
