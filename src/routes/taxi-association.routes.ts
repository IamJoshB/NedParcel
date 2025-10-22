import express from "express";
import {
  createTaxiAssociation,
  getAllTaxiAssociations,
  getTaxiAssociationById,
  updateTaxiAssociation,
  deleteTaxiAssociation,
  linkBankingDetails,
  unlinkBankingDetails,
  getTaxiAssociationFilteringValues,
} from "../controllers/taxi-association.controller";

const router = express.Router();

router.post("/", createTaxiAssociation);
router.get("/", getAllTaxiAssociations);
router.get("/filtering-values", getTaxiAssociationFilteringValues);
router.get("/:id", getTaxiAssociationById);
router.put("/:id", updateTaxiAssociation);
router.delete("/:id", deleteTaxiAssociation);

// Banking linking
router.post("/link-banking", linkBankingDetails);
router.post("/unlink-banking", unlinkBankingDetails);

export default router;
