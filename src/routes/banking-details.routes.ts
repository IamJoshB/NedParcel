import { Router } from "express";
import {
  createBankingDetail,
  getAllBankingDetails,
  getBankingDetailById,
  updateBankingDetail,
  deleteBankingDetail,
  getBankingDetailsFilteringValues,
} from "../controllers/banking-details.controller";

const router = Router();

router.post("/", createBankingDetail);
router.get("/", getAllBankingDetails);
router.get("/filtering-values", getBankingDetailsFilteringValues);
router.get("/:id", getBankingDetailById);
router.put("/:id", updateBankingDetail);
router.delete("/:id", deleteBankingDetail);

export default router;
