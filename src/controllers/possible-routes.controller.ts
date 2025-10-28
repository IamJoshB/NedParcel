import { Request, Response } from "express";
import Driver from "../models/driver-details.model";
import Route from "../models/possible-routes.model";

/**
 * @swagger
 * tags:
 *   - name: Routes
 *     description: Manage possible taxi routes between ranks.
 * components:
 *   schemas:
 *     ObjectId:
 *       type: string
 *       description: MongoDB ObjectId
 *       example: 6510d2f4a1c2b3001234abcd
 *     Route:
 *       type: object
 *       properties:
 *         _id:
 *           $ref: '#/components/schemas/ObjectId'
 *         distance:
 *           type: number
 *           example: 12.5
 *         fromRank:
 *           $ref: '#/components/schemas/ObjectId'
 *         toRank:
 *           $ref: '#/components/schemas/ObjectId'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       required:
 *         - distance
 *         - fromRank
 *         - toRank
 *     CreateRouteRequest:
 *       type: object
 *       properties:
 *         distance:
 *           type: number
 *         fromRank:
 *           $ref: '#/components/schemas/ObjectId'
 *         toRank:
 *           $ref: '#/components/schemas/ObjectId'
 *       required:
 *         - distance
 *         - fromRank
 *         - toRank
 *     UpdateRouteRequest:
 *       type: object
 *       description: Partial update for a route.
 *       properties:
 *         distance:
 *           type: number
 *         fromRank:
 *           $ref: '#/components/schemas/ObjectId'
 *         toRank:
 *           $ref: '#/components/schemas/ObjectId'
 *     LinkDriverEntityRequest:
 *       type: object
 *       properties:
 *         driverId:
 *           $ref: '#/components/schemas/ObjectId'
 *         entityType:
 *           type: string
 *           enum: [taxiRank, bankingDetails, taxiAssociation]
 *           example: taxiRank
 *         entityId:
 *           $ref: '#/components/schemas/ObjectId'
 *       required:
 *         - driverId
 *         - entityType
 *         - entityId
 *     UnlinkDriverEntityRequest:
 *       type: object
 *       properties:
 *         driverId:
 *           $ref: '#/components/schemas/ObjectId'
 *         entityType:
 *           type: string
 *           enum: [taxiRank, bankingDetails, taxiAssociation]
 *           example: bankingDetails
 *       required:
 *         - driverId
 *         - entityType
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *         error:
 *           description: Additional error detail
 *       required:
 *         - message
 */

/**
 * @swagger
 * /api/possible-routes:
 *   post:
 *     summary: Create a Route
 *     description: Creates a possible route between two taxi ranks.
 *     tags: [Routes]
 *     operationId: createRoute
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRouteRequest'
 *     responses:
 *       201:
 *         description: Route created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Route'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const createRoute = async (req: Request, res: Response) => {
  try {
    const route = new Route(req.body);
    const savedRoute = await route.save();
    res.status(201).json(savedRoute);
  } catch (error) {
    res.status(500).json({ message: "Error creating route", error });
  }
};

/**
 * @swagger
 * /api/possible-routes:
 *   get:
 *     summary: Get all Routes
 *     description: Returns all possible routes with populated ranks.
 *     tags: [Routes]
 *     operationId: getAllRoutes
 *     responses:
 *       200:
 *         description: List of routes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Route'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const getAllRoutes = async (_req: Request, res: Response) => {
  try {
    const routes = await Route.find().populate("fromRank toRank");
    res.status(200).json(routes);
  } catch (error) {
    res.status(500).json({ message: "Error getting routes", error });
  }
};

/**
 * @swagger
 * /api/possible-routes/{id}:
 *   get:
 *     summary: Get a Route by ID
 *     description: Retrieves a route with populated ranks.
 *     tags: [Routes]
 *     operationId: getRouteById
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 *         description: Route ID
 *     responses:
 *       200:
 *         description: Route found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Route'
 *       404:
 *         description: Route not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const getRouteById = async (req: Request, res: Response) => {
  try {
    const route = await Route.findById(req.params.id).populate(
      "fromRank toRank"
    );
    if (!route) return res.status(404).json({ message: "Route not found" });
    res.status(200).json(route);
  } catch (error) {
    res.status(500).json({ message: "Error getting route", error });
  }
};

/**
 * @swagger
 * /api/possible-routes/{id}:
 *   put:
 *     summary: Update a Route
 *     description: Partially or fully updates a route.
 *     tags: [Routes]
 *     operationId: updateRoute
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 *         description: Route ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateRouteRequest'
 *     responses:
 *       200:
 *         description: Route updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Route'
 *       404:
 *         description: Route not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const updateRoute = async (req: Request, res: Response) => {
  try {
    const updatedRoute = await Route.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedRoute)
      return res.status(404).json({ message: "Route not found" });
    res.status(200).json(updatedRoute);
  } catch (error) {
    res.status(500).json({ message: "Error updating route", error });
  }
};

/**
 * @swagger
 * /api/possible-routes/{id}:
 *   delete:
 *     summary: Delete a Route
 *     description: Permanently removes a route.
 *     tags: [Routes]
 *     operationId: deleteRoute
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 *         description: Route ID
 *     responses:
 *       200:
 *         description: Route deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *               required:
 *                 - message
 *       404:
 *         description: Route not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const deleteRoute = async (req: Request, res: Response) => {
  try {
    const deletedRoute = await Route.findByIdAndDelete(req.params.id);
    if (!deletedRoute)
      return res.status(404).json({ message: "Route not found" });
    res.status(200).json({ message: "Route deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting route", error });
  }
};
