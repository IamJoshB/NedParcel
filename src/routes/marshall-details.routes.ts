import express from "express";
import {
  createMarshall,
  getAllMarshalls,
  getMarshallById,
  updateMarshall,
  deleteMarshall,
  linkTaxiRank,
  unlinkTaxiRank,
  linkTaxiAssociation,
  unlinkTaxiAssociation,
  getMarshallFilteringValues,
} from "../controllers/marshall-details.controller";

const router = express.Router();

router.post("/", createMarshall);
router.get("/", getAllMarshalls);
router.get("/filtering-values", getMarshallFilteringValues);
router.get("/:id", getMarshallById);
router.put("/:id", updateMarshall);
router.delete("/:id", deleteMarshall);

// Linking operations
router.post("/link-rank", linkTaxiRank);
router.post("/unlink-rank", unlinkTaxiRank);

router.post("/link-association", linkTaxiAssociation);
router.post("/unlink-association", unlinkTaxiAssociation);

export default router;
