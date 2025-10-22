import express from "express";
import {
  createRoute,
  getAllRoutes,
  getRouteById,
  updateRoute,
  deleteRoute,
  linkDriver,
  unlinkDriver,
} from "../controllers/possible-routes.controller";

const router = express.Router();

// Route CRUD
router.post("/", createRoute);
router.get("/", getAllRoutes);
router.get("/:id", getRouteById);
router.put("/:id", updateRoute);
router.delete("/:id", deleteRoute);

// Linking and unlinking endpoints
router.post("/link-driver", linkDriver);
router.post("/unlink-driver", unlinkDriver);

export default router;
