import { Router } from "express";
import {
  createTrip,
  getTrips,
  getTripById,
  updateTrip,
  deleteTrip,
  linkDriverAndRoute,
  unlinkDriverAndRoute,
} from "../controllers/trip-details.controller";

const router = Router();

router.post("/", createTrip);
router.get("/", getTrips);
router.get("/:id", getTripById);
router.put("/:id", updateTrip);
router.delete("/:id", deleteTrip);

router.post("/link-driver-and-route", linkDriverAndRoute);
router.post("/unlink-driver-and-route", unlinkDriverAndRoute);

export default router;