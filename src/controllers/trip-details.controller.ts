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
 *         fullDistance:
 *           type: number
 *           example: 42.7
 *           description: Sum of distances across all legs.
 *         origin:
 *           $ref: '#/components/schemas/ObjectId'
 *         destination:
 *           $ref: '#/components/schemas/ObjectId'
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
 *         - fullDistance
 *         - origin
 *         - destination
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
 *               driverId:
 *                 $ref: '#/components/schemas/ObjectId'
 *               routeId:
 *                 $ref: '#/components/schemas/ObjectId'
 *             required:
 *               - leg
 *         origin:
 *           $ref: '#/components/schemas/ObjectId'
 *         destination:
 *           $ref: '#/components/schemas/ObjectId'
 *               - associationSplit
 *               - driverSplit
 *               - driverId
 *               - routeId
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
 *         legs:
 *           type: array
 *           description: Optional replacement leg definitions with driverId/routeId.
 *             properties:
 *         - price
 *         - origin
 *         - destination
 *               associationSplit:
 *                 type: number
 *               driverSplit:
 *                 type: number
 *               driverId:
 *                 $ref: '#/components/schemas/ObjectId'
 *               routeId:
 *                 $ref: '#/components/schemas/ObjectId'
 *             required:
 *               - leg
 *               - associationSplit
 *               - driverSplit
 *               - driverId
 *               - routeId
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
    // Transform incoming route array with driverId/routeId into Trip schema shape
    const { route, price, origin, destination, ...rest } = req.body as any;

    let effectiveRoute = route;
    // Auto-generate shortest hop route if origin & destination provided and no route legs specified
    if ((!effectiveRoute || !effectiveRoute.length) && origin && destination) {
      // BFS over PossibleRoute graph
      const PossibleRoute = mongoose.model("PossibleRoute");
      const edges = await PossibleRoute.find({
        fromRank: { $exists: true },
        toRank: { $exists: true },
      })
        .select("fromRank toRank distance farePrice")
        .lean();
      const adjacency: Record<string, string[]> = {};
      for (const e of edges) {
        const from = String(e.fromRank);
        const to = String(e.toRank);
        adjacency[from] = adjacency[from] || [];
        adjacency[from].push(to);
      }
      const start = String(origin);
      const goal = String(destination);
      const queue: string[] = [start];
      const prev: Record<string, string | null> = { [start]: null };
      let found = false;
      while (queue.length && !found) {
        const current = queue.shift()!;
        if (current === goal) {
          found = true;
          break;
        }
        for (const nxt of adjacency[current] || []) {
          if (!(nxt in prev)) {
            prev[nxt] = current;
            queue.push(nxt);
          }
        }
      }
      if (found) {
        // Reconstruct path
        const pathRanks: string[] = [];
        let cur: string | null = goal;
        while (cur) {
          pathRanks.push(cur);
          cur = prev[cur];
        }
        pathRanks.reverse(); // start -> goal
        // Convert consecutive rank pairs to PossibleRoute ids
        const rankPairs: Array<{ from: string; to: string }> = [];
        for (let i = 0; i < pathRanks.length - 1; i++) {
          rankPairs.push({ from: pathRanks[i], to: pathRanks[i + 1] });
        }
        // Index edges by from->to for quick lookup
        const edgeMap = new Map<string, any>();
        for (const e of edges)
          edgeMap.set(`${String(e.fromRank)}->${String(e.toRank)}`, e);
        effectiveRoute = rankPairs.map((pair, idx) => {
          const edge = edgeMap.get(`${pair.from}->${pair.to}`);
          return {
            leg: idx + 1,
            associationSplit: 0,
            driverSplit: 0,
            routeId: edge?._id, // will be mapped below
          };
        });
      } else {
        effectiveRoute = [];
      }
    }
    const mappedRoute = Array.isArray(route)
      ? route.map((leg: any) => ({
          leg: leg.leg || 1,
          associationSplit: leg.associationSplit,
          driverSplit: leg.driverSplit,
          driver: leg.driverId
            ? new mongoose.Types.ObjectId(leg.driverId)
            : undefined,
          details: leg.routeId
            ? new mongoose.Types.ObjectId(leg.routeId)
            : undefined,
        }))
      : Array.isArray(effectiveRoute)
      ? effectiveRoute.map((leg: any) => ({
          leg: leg.leg || 1,
          associationSplit: leg.associationSplit || 0,
          driverSplit: leg.driverSplit || 0,
          driver: leg.driverId
            ? new mongoose.Types.ObjectId(leg.driverId)
            : undefined,
          details: leg.routeId
            ? new mongoose.Types.ObjectId(leg.routeId)
            : undefined,
        }))
      : [];
    const trip = new Trip({
      price,
      origin,
      destination,
      route: mappedRoute,
      ...rest,
    });
    const savedTrip = await trip.save();
    const deep = req.query.deep === "true";
    const populated = deep
      ? await Trip.findById(savedTrip._id)
          .populate("origin destination")
          .populate({
            path: "route.driver",
          })
          .populate({
            path: "route.details",
            populate: ["fromRank", "toRank"],
          })
          .populate({ path: "route.association" })
      : savedTrip;
    res.status(201).json(populated);
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
export const getTrips = async (req: Request, res: Response) => {
  try {
    const deep = req.query.deep === "true";
    let query = Trip.find();
    if (deep) {
      query = query
        .populate("origin destination")
        .populate({ path: "route.driver" })
        .populate({ path: "route.association" })
        .populate({ path: "route.details", populate: ["fromRank", "toRank"] });
    } else {
      query = query.populate("route.driver route.details");
    }
    const trips = await query;
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
    const deep = req.query.deep === "true";
    let query = Trip.findById(req.params.id);
    if (deep) {
      query = query
        .populate("origin destination")
        .populate({ path: "route.driver" })
        .populate({ path: "route.association" })
        .populate({ path: "route.details", populate: ["fromRank", "toRank"] });
    } else {
      query = query.populate("route.driver route.details");
    }
    const trip = await query;
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
    const deep = req.query.deep === "true";
    const { legs, route, price, ...rest } = req.body as any;
    let updatePayload: any = { ...rest };
    // Allow either 'legs' (preferred) or full 'route' array for replacement
    const incoming = legs || route;
    if (incoming) {
      updatePayload.route = incoming.map((leg: any) => ({
        leg: leg.leg || 1,
        associationSplit: leg.associationSplit,
        driverSplit: leg.driverSplit,
        driver: leg.driverId
          ? new mongoose.Types.ObjectId(leg.driverId)
          : undefined,
        details: leg.routeId
          ? new mongoose.Types.ObjectId(leg.routeId)
          : undefined,
      }));
    }
    if (price !== undefined) updatePayload.price = price;
    const updatedTrip = await Trip.findByIdAndUpdate(
      req.params.id,
      updatePayload,
      { new: true }
    );
    if (!updatedTrip)
      return res.status(404).json({ message: "Trip not found" });
    let trip: any = updatedTrip;
    if (deep) {
      trip = await Trip.findById(updatedTrip._id)
        .populate("origin destination")
        .populate({ path: "route.driver" })
        .populate({ path: "route.association" })
        .populate({ path: "route.details", populate: ["fromRank", "toRank"] });
    }
    res.status(200).json(trip);
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
