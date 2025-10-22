import express from "express";
import {
  createTaxiRank,
  getAllTaxiRanks,
  getTaxiRankById,
  updateTaxiRank,
  deleteTaxiRank,
  linkDestinationRank,
  unlinkDestinationRank,
  linkTaxiAssociation,
  unlinkTaxiAssociation,
  getTaxiRankFilteringValues,
} from "../controllers/taxi-ranks.controller";

const router = express.Router();

router.post("/", createTaxiRank);
router.get("/", getAllTaxiRanks);
router.get("/filtering-values", getTaxiRankFilteringValues);
router.get("/:id", getTaxiRankById);
router.put("/:id", updateTaxiRank);
router.delete("/:id", deleteTaxiRank);

router.post("/link-destination", linkDestinationRank);
router.post("/unlink-destination", unlinkDestinationRank);

router.post("/link-association", linkTaxiAssociation);
router.post("/unlink-association", unlinkTaxiAssociation);

export default router;
