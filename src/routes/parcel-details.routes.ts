import { Router } from "express";
import {
  createParcel,
  getAllParcels,
  getParcelById,
  updateParcel,
  deleteParcel,
  updateParcelStatus,
  verifyParcelOtp,
  moveParcelLeg,
} from "../controllers/parcel-details.controller";

const router = Router();

router.post("/", createParcel);
router.get("/", getAllParcels);
router.get("/:id", getParcelById);
router.put("/:id", updateParcel);
router.delete("/:id", deleteParcel);
router.post("/update-status", updateParcelStatus);
router.post("/verify-otp", verifyParcelOtp);
router.post("/move-leg", moveParcelLeg);

export default router;
