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
 *       description: One leg of a trip. associationSplit & driverSplit default to 0 and driver/details may be absent when auto-generated.
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
 *           readOnly: true
 *           description: Sum of distances across all legs (server-calculated).
 *         origin:
 *           $ref: '#/components/schemas/ObjectId'
 *         destination:
 *           $ref: '#/components/schemas/ObjectId'
 *         route:
 *           type: array
 *           description: Ordered legs; optional on create if origin & destination provided (BFS auto-generation).
 *           items:
 *             $ref: '#/components/schemas/TripLeg'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           readOnly: true
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           readOnly: true
 *       required:
 *         - price
 *         - origin
 *         - destination
 *     CreateTripRequest:
 *       type: object
 *       description: Provide either an explicit 'route' OR 'origin' & 'destination' for auto-generation.
 *       properties:
 *         price:
 *           type: number
 *         origin:
 *           $ref: '#/components/schemas/ObjectId'
 *         destination:
 *           $ref: '#/components/schemas/ObjectId'
 *         route:
 *           type: array
 *           description: Explicit legs (omit for auto-generation).
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
 *       required:
 *         - price
 *         - origin
 *         - destination
 *     UpdateTripRequest:
 *       type: object
 *       description: Partial update; supply 'route' (TripLeg objects) OR 'legs' (mapping with driverId/routeId) to replace legs.
 *       properties:
 *         price:
 *           type: number
 *         origin:
 *           $ref: '#/components/schemas/ObjectId'
 *         destination:
 *           $ref: '#/components/schemas/ObjectId'
 *         route:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/TripLeg'
 *         legs:
 *           type: array
 *           description: Replacement leg definitions (mapping style).
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
 *               - associationSplit
 *               - driverSplit
 *     LinkDriverAndRouteRequest:
 *       type: object
 *       properties:
 *         tripId:
 *           $ref: '#/components/schemas/ObjectId'
 *         legIndex:
 *           type: integer
 *           minimum: 0
 *           description: Zero-based index of leg.
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
*     description: Creates a new trip. If 'route' omitted and origin & destination provided, shortest-hop route auto-generated.
 *     tags: [Trips]
 *     operationId: createTrip
*     parameters:
*       - in: query
*         name: deep
*         schema:
*           type: boolean
*         description: If true, returns deeply populated trip.
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
*     description: Returns all trips. Use ?deep=true for full population.
 *     tags: [Trips]
 *     operationId: getTrips
*     parameters:
*       - in: query
*         name: deep
*         schema:
*           type: boolean
*         description: If true, deeply populates origin, destination, route.* references.
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
*     description: Retrieves a trip. Use ?deep=true for full nested population.
 *     tags: [Trips]
 *     operationId: getTripById
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 *         description: Trip ID
*       - in: query
*         name: deep
*         schema:
*           type: boolean
*         description: If true, deeply populates nested references.
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
*     description: Partially updates metadata or replaces legs. Provide 'route' OR 'legs'. Use ?deep=true for nested population in response.
 *     tags: [Trips]
 *     operationId: updateTrip
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 *         description: Trip ID
*       - in: query
*         name: deep
*         schema:
*           type: boolean
*         description: If true, deeply populates nested references in response.
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
