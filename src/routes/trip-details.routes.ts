import { Router } from "express";
import {
  createTrip,
  getTrips,
  getTripById,
  updateTrip,
  deleteTrip,
  linkDriverToTripLeg,
  unlinkDriverFromTripLeg,
} from "../controllers/trip-details.controller";

const router = Router();

router.post("/", createTrip);
router.get("/", getTrips);
router.get("/:id", getTripById);
router.put("/:id", updateTrip);
router.delete("/:id", deleteTrip);
router.post("/link-driver", linkDriverToTripLeg);
router.post("/unlink-driver", unlinkDriverFromTripLeg);

export default router;
