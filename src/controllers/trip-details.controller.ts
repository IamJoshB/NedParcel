import { Request, Response } from "express";
import Trip from "../models/trip-details.model";
import mongoose from "mongoose";

/**
 * @swagger
 * tags:
 *   - name: Trips
 *     description: Manage trips composed of multiple route legs and associated drivers.
 * components:
 *   schemas:
 *     ObjectId:
 *       type: string
 *       description: MongoDB ObjectId
 *       example: 6510d2f4a1c2b3001234abcd
 *     TripLeg:
 *       type: object
 *       properties:
 *         leg:
 *           type: integer
 *           example: 1
 *         associationSplit:
 *           type: number
 *           format: float
 *           example: 60
 *         driverSplit:
 *           type: number
 *           format: float
 *           example: 40
 *         driver:
 *           $ref: '#/components/schemas/ObjectId'
 *         details:
 *           $ref: '#/components/schemas/ObjectId'
 *       required:
 *         - leg
 *         - associationSplit
 *         - driverSplit
 *     Trip:
 *       type: object
 *       properties:
 *         _id:
 *           $ref: '#/components/schemas/ObjectId'
 *         price:
 *           type: number
 *           example: 120.5
 *         route:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/TripLeg'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       required:
 *         - price
 *         - route
 *     CreateTripRequest:
 *       type: object
 *       properties:
 *         price:
 *           type: number
 *         route:
 *           type: array
 *           description: Initial set of legs in the trip.
 *           items:
 *             type: object
 *             properties:
 *               leg:
 *                 type: integer
 *               associationSplit:
 *                 type: number
 *               driverSplit:
 *                 type: number
 *             required:
 *               - leg
 *               - associationSplit
 *               - driverSplit
 *       required:
 *         - price
 *         - route
 *     UpdateTripRequest:
 *       type: object
 *       description: Partial update of trip fields or legs.
 *       properties:
 *         price:
 *           type: number
 *         route:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/TripLeg'
 *     LinkDriverAndRouteRequest:
 *       type: object
 *       properties:
 *         tripId:
 *           $ref: '#/components/schemas/ObjectId'
 *         legIndex:
 *           type: integer
 *           minimum: 0
 *           description: Zero-based index of the leg in the trip.route array.
 *           example: 0
 *         driverId:
 *           $ref: '#/components/schemas/ObjectId'
 *         routeId:
 *           $ref: '#/components/schemas/ObjectId'
 *       required:
 *         - tripId
 *         - legIndex
 *         - driverId
 *         - routeId
 *     UnlinkDriverAndRouteRequest:
 *       type: object
 *       properties:
 *         tripId:
 *           $ref: '#/components/schemas/ObjectId'
 *         legIndex:
 *           type: integer
 *           minimum: 0
 *           example: 0
 *       required:
 *         - tripId
 *         - legIndex
 *     LinkDriverAndRouteResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: Driver and Route linked successfully
 *         trip:
 *           $ref: '#/components/schemas/Trip'
 *       required:
 *         - message
 *         - trip
 *     UnlinkDriverAndRouteResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: Driver and Route unlinked successfully
 *         trip:
 *           $ref: '#/components/schemas/Trip'
 *       required:
 *         - message
 *         - trip
 *     DeleteTripResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: Trip deleted successfully
 *       required:
 *         - message
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
 * /api/trip-details:
 *   post:
 *     summary: Create a Trip
 *     description: Creates a new trip with pricing and initial legs.
 *     tags: [Trips]
 *     operationId: createTrip
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTripRequest'
 *     responses:
 *       201:
 *         description: Trip created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Trip'
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
export const createTrip = async (req: Request, res: Response) => {
  try {
    const trip = new Trip(req.body);
    const savedTrip = await trip.save();
    res.status(201).json(savedTrip);
  } catch (error) {
    res.status(500).json({ message: "Error creating trip", error });
  }
};

/**
 * @swagger
 * /api/trip-details:
 *   get:
 *     summary: Get all Trips
 *     description: Returns all trips with populated driver and route references for each leg.
 *     tags: [Trips]
 *     operationId: getTrips
 *     responses:
 *       200:
 *         description: List of trips
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Trip'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const getTrips = async (_req: Request, res: Response) => {
  try {
  const trips = await Trip.find().populate("route.driver route.details");
    res.status(200).json(trips);
  } catch (error) {
    res.status(500).json({ message: "Error getting trips", error });
  }
};

/**
 * @swagger
 * /api/trip-details/{id}:
 *   get:
 *     summary: Get a Trip by ID
 *     description: Retrieves a trip with populated driver and route references per leg.
 *     tags: [Trips]
 *     operationId: getTripById
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 *         description: Trip ID
 *     responses:
 *       200:
 *         description: Trip found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Trip'
 *       404:
 *         description: Trip not found
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
export const getTripById = async (req: Request, res: Response) => {
  try {
    const trip = await Trip.findById(req.params.id).populate(
  "route.driver route.details"
    );
    if (!trip) return res.status(404).json({ message: "Trip not found" });
    res.status(200).json(trip);
  } catch (error) {
    res.status(500).json({ message: "Error getting trip", error });
  }
};

/**
 * @swagger
 * /api/trip-details/{id}:
 *   put:
 *     summary: Update a Trip
 *     description: Replaces or partially updates trip metadata and legs.
 *     tags: [Trips]
 *     operationId: updateTrip
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 *         description: Trip ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTripRequest'
 *     responses:
 *       200:
 *         description: Trip updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Trip'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Trip not found
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
export const updateTrip = async (req: Request, res: Response) => {
  try {
    const updatedTrip = await Trip.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updatedTrip)
      return res.status(404).json({ message: "Trip not found" });
    res.status(200).json(updatedTrip);
  } catch (error) {
    res.status(500).json({ message: "Error updating trip", error });
  }
};

/**
 * @swagger
 * /api/trip-details/{id}:
 *   delete:
 *     summary: Delete a Trip
 *     description: Permanently removes a trip.
 *     tags: [Trips]
 *     operationId: deleteTrip
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 *         description: Trip ID
 *     responses:
 *       200:
 *         description: Trip deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeleteTripResponse'
 *       404:
 *         description: Trip not found
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
export const deleteTrip = async (req: Request, res: Response) => {
  try {
    const deletedTrip = await Trip.findByIdAndDelete(req.params.id);
    if (!deletedTrip)
      return res.status(404).json({ message: "Trip not found" });
    res.status(200).json({ message: "Trip deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting trip", error });
  }
};

/**
 * @swagger
 * /api/trip-details/link-driver-and-route:
 *   post:
 *     summary: Link a Driver and Route to a Trip leg
 *     description: Sets the driver and route reference for a specific leg index within a trip.
 *     tags: [Trips]
 *     operationId: linkDriverAndRoute
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LinkDriverAndRouteRequest'
 *     responses:
 *       200:
 *         description: Driver and route linked
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LinkDriverAndRouteResponse'
 *       400:
 *         description: Validation error (invalid leg index)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Trip not found
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
export const linkDriverAndRoute = async (req: Request, res: Response) => {
  try {
    const { tripId, legIndex, driverId, routeId } = req.body;

    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ message: "Trip not found" });

    if (!trip.route[legIndex])
      return res.status(400).json({ message: "Invalid leg index" });

    trip.route[legIndex].driver = new mongoose.Types.ObjectId(driverId);
  trip.route[legIndex].details = new mongoose.Types.ObjectId(routeId);

    await trip.save();
    res
      .status(200)
      .json({ message: "Driver and Route linked successfully", trip });
  } catch (error) {
    res.status(500).json({ message: "Error linking driver and route", error });
  }
};

/**
 * @swagger
 * /api/trip-details/unlink-driver-and-route:
 *   post:
 *     summary: Unlink a Driver and Route from a Trip leg
 *     description: Removes the driver and route references for a specific leg index within a trip.
 *     tags: [Trips]
 *     operationId: unlinkDriverAndRoute
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UnlinkDriverAndRouteRequest'
 *     responses:
 *       200:
 *         description: Driver and route unlinked
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UnlinkDriverAndRouteResponse'
 *       400:
 *         description: Validation error (invalid leg index)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Trip not found
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
export const unlinkDriverAndRoute = async (req: Request, res: Response) => {
  try {
    const { tripId, legIndex } = req.body;

    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ message: "Trip not found" });

    if (!trip.route[legIndex])
      return res.status(400).json({ message: "Invalid leg index" });

    trip.route[legIndex].driver = undefined;
  trip.route[legIndex].details = undefined;

    await trip.save();
    res
      .status(200)
      .json({ message: "Driver and Route unlinked successfully", trip });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error unlinking driver and route", error });
  }
};
