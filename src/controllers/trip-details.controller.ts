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
 *           readOnly: true
 *           description: Sum of leg route prices (server-calculated from PossibleRoute.price values).
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
 *           readOnly: true
 *           description: Ordered auto-generated legs derived from origin & destination.
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
 *         - origin
 *         - destination
 *     CreateTripRequest:
 *       type: object
 *       description: Input for trip creation; route auto-generated (shortest hop). Price is derived automatically (no price field allowed).
 *       properties:
 *         origin:
 *           $ref: '#/components/schemas/ObjectId'
 *         destination:
 *           $ref: '#/components/schemas/ObjectId'
 *       required:
 *         - origin
 *         - destination
 *     UpdateTripRequest:
 *       type: object
 *       description: Partial update of trip metadata (origin/destination). Price/route are immutable and recalculated automatically.
 *       properties:
 *         origin:
 *           $ref: '#/components/schemas/ObjectId'
 *         destination:
 *           $ref: '#/components/schemas/ObjectId'
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
 *     LinkDriverToLegRequest:
 *       type: object
 *       description: Link a driver to a specific trip leg. Driver must already be linked to the origin rank of that leg.
 *       properties:
 *         tripId:
 *           $ref: '#/components/schemas/ObjectId'
 *         leg:
 *           type: integer
 *           minimum: 1
 *           description: 1-based leg number within the trip route.
 *         driverId:
 *           $ref: '#/components/schemas/ObjectId'
 *       required:
 *         - tripId
 *         - leg
 *         - driverId
 *     UnlinkDriverFromLegRequest:
 *       type: object
 *       description: Unlink a driver from a specific trip leg.
 *       properties:
 *         tripId:
 *           $ref: '#/components/schemas/ObjectId'
 *         leg:
 *           type: integer
 *           minimum: 1
 *           description: 1-based leg number within the trip route.
 *       required:
 *         - tripId
 *         - leg
 *     LinkDriverToLegResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: Driver linked to leg successfully
 *         trip:
 *           $ref: '#/components/schemas/Trip'
 *       required:
 *         - message
 *         - trip
 *     UnlinkDriverFromLegResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: Driver unlinked from leg successfully
 *         trip:
 *           $ref: '#/components/schemas/Trip'
 *       required:
 *         - message
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
 *           type: string
 *           description: Optional additional error detail (debug / tracing)
 *       required:
 *         - message
 */

/**
* @swagger
* /api/trip-details:
*   post:
*     summary: Create a Trip
*     description: Creates a new trip. Route is auto-generated (shortest-hop) from origin to destination; client must not supply route legs.
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
    const { origin, destination, ...rest } = req.body as any;
    if (!origin || !destination) {
      return res.status(400).json({
        message: "origin and destination are required to auto-generate route",
      });
    }
    // Fetch all possible routes to construct graph
    const PossibleRoute = mongoose.model("PossibleRoute");
    const edges = await PossibleRoute.find({})
      .select("fromRank toRank distance farePrice price driverSplit associationSplit")
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
    let mappedRoute: any[] = [];
    if (found) {
      // Reconstruct path of ranks
      const pathRanks: string[] = [];
      let cur: string | null = goal;
      while (cur) {
        pathRanks.push(cur);
        cur = prev[cur];
      }
      pathRanks.reverse();
      // Build leg entries from consecutive rank pairs
      const edgeMap = new Map<string, any>();
      for (const e of edges) {
        edgeMap.set(`${String(e.fromRank)}->${String(e.toRank)}`, e);
      }
      let fullDistance = 0;
      let totalPrice = 0;
      mappedRoute = pathRanks.slice(0, -1).map((fromRank, idx) => {
        const toRank = pathRanks[idx + 1];
        const edge = edgeMap.get(`${fromRank}->${toRank}`);
        if (edge?.distance) fullDistance += edge.distance;
        if (edge?.price) totalPrice += edge.price;
        return {
          leg: idx + 1,
          associationSplit: edge?.associationSplit ?? 0,
          driverSplit: edge?.driverSplit ?? 0,
          details: edge?._id,
        };
      });
      const trip = new Trip({
        price: totalPrice,
        origin,
        destination,
        route: mappedRoute,
        fullDistance,
        ...rest,
      });
      const savedTrip = await trip.save();
      const deep = req.query.deep === "true";
      const populated = deep
        ? await Trip.findById(savedTrip._id)
            .populate("origin destination")
            .populate({ path: "route.driver" })
            .populate({
              path: "route.details",
              populate: ["fromRank", "toRank"],
            })
            .populate({ path: "route.association" })
        : savedTrip;
      return res.status(201).json(populated);
    } else {
      return res.status(400).json({
        message: "No route could be auto-generated between origin and destination",
      });
    }
      // unreachable fallback removed (always returns in found/else)
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
*     description: Partially updates metadata (price/origin/destination). Legs are immutable post creation. Use ?deep=true for nested population in response.
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
    const { origin, destination } = req.body as any;
    const existing = await Trip.findById(req.params.id).populate({
      path: "route.details",
      select: "distance price fromRank toRank driverSplit associationSplit",
    });
    if (!existing) return res.status(404).json({ message: "Trip not found" });
    if (origin) existing.origin = origin;
    if (destination) existing.destination = destination;
    // Recompute fullDistance from populated route.details
    let fullDistance = 0;
    let totalPrice = 0;
    for (const leg of existing.route as any[]) {
      if (leg.details && (leg.details as any).distance) {
        fullDistance += (leg.details as any).distance;
      } else if (leg.details) {
        // fetch if not populated distance
        const pr: any = await mongoose
          .model("PossibleRoute")
          .findById(leg.details)
          .select("distance price driverSplit associationSplit")
          .lean();
        if (pr && typeof pr.distance === "number") fullDistance += pr.distance;
        if (pr && typeof pr.price === "number") totalPrice += pr.price;
        // update splits if empty
        if (pr) {
          if (typeof pr.driverSplit === "number") leg.driverSplit = pr.driverSplit;
          if (typeof pr.associationSplit === "number") leg.associationSplit = pr.associationSplit;
        }
      }
      // if details already populated include its price
      if (leg.details && (leg.details as any).price) {
        totalPrice += (leg.details as any).price;
      }
      if (leg.details && (leg.details as any).driverSplit !== undefined) {
        leg.driverSplit = (leg.details as any).driverSplit;
      }
      if (leg.details && (leg.details as any).associationSplit !== undefined) {
        leg.associationSplit = (leg.details as any).associationSplit;
      }
    }
    existing.price = totalPrice;
    existing.fullDistance = fullDistance;
    const saved = await existing.save();
    const populated = deep
      ? await Trip.findById(saved._id)
          .populate("origin destination")
          .populate({ path: "route.driver" })
          .populate({ path: "route.association" })
          .populate({ path: "route.details", populate: ["fromRank", "toRank"] })
      : saved;
    res.status(200).json(populated);
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
* /api/trip-details/link-driver:
*   post:
*     summary: Link a driver to a trip leg
*     description: Links a driver to the specified leg of a trip. Validation ensures the driver is linked to the origin rank of the leg's PossibleRoute (fromRank).
*     tags: [Trips]
*     operationId: linkDriverToTripLeg
*     parameters:
*       - in: query
*         name: deep
*         schema:
*           type: boolean
*         description: If true, returns deeply populated trip in response.
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             $ref: '#/components/schemas/LinkDriverToLegRequest'
*     responses:
*       200:
*         description: Driver linked
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/LinkDriverToLegResponse'
*       400:
*         description: Validation error
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/ErrorResponse'
*       404:
*         description: Trip or Driver not found
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
export const linkDriverToTripLeg = async (req: Request, res: Response) => {
  try {
    const deep = req.query.deep === "true";
    const { tripId, leg, driverId } = req.body as any;
    if (!tripId || !leg || !driverId) {
      return res.status(400).json({ message: "tripId, leg and driverId are required" });
    }
    const trip = await Trip.findById(tripId).populate({
      path: "route.details",
      select: "fromRank toRank",
    });
    if (!trip) return res.status(404).json({ message: "Trip not found" });
    const legIndex = leg - 1;
    if (legIndex < 0 || legIndex >= trip.route.length) {
      return res.status(400).json({ message: "Invalid leg number" });
    }
    const legEntry: any = (trip.route as any[])[legIndex];
    if (!legEntry.details) {
      return res.status(400).json({ message: "Leg has no route details to validate against" });
    }
    // Fetch driver and ensure they are linked to fromRank of this leg
    const Driver = mongoose.model("Driver");
    const PossibleRoute = mongoose.model("PossibleRoute");
    // Ensure details is populated for fromRank, else fetch
    let fromRankId: any = (legEntry.details as any).fromRank;
    if (!fromRankId) {
      const pr: any = await PossibleRoute.findById(legEntry.details).select("fromRank toRank").lean();
      if (!pr) return res.status(400).json({ message: "Associated PossibleRoute not found" });
      fromRankId = pr.fromRank;
    }
    const driver: any = await Driver.findById(driverId).select("linkedRanks").lean();
    if (!driver) return res.status(404).json({ message: "Driver not found" });
    const linkedRankIds = (driver.linkedRanks || []).map((r: any) => String(r));
    if (!linkedRankIds.includes(String(fromRankId))) {
      return res.status(400).json({ message: "Driver must be linked to the origin rank of the leg (fromRank) before assignment" });
    }
    // Assign driver to leg
    (trip.route as any[])[legIndex].driver = driverId;
    await trip.save();
    const populated = deep
      ? await Trip.findById(trip._id)
          .populate("origin destination")
          .populate({ path: "route.driver" })
          .populate({ path: "route.association" })
          .populate({ path: "route.details", populate: ["fromRank", "toRank"] })
      : await Trip.findById(trip._id).populate("route.driver route.details");
    return res.status(200).json({ message: "Driver linked to leg successfully", trip: populated });
  } catch (error) {
    res.status(500).json({ message: "Error linking driver to leg", error });
  }
};

/**
* @swagger
* /api/trip-details/unlink-driver:
*   post:
*     summary: Unlink a driver from a trip leg
*     description: Removes the driver assignment from the specified leg of a trip.
*     tags: [Trips]
*     operationId: unlinkDriverFromTripLeg
*     parameters:
*       - in: query
*         name: deep
*         schema:
*           type: boolean
*         description: If true, returns deeply populated trip in response.
*     requestBody:
*       required: true
*       content:
*         application/json:
*           schema:
*             $ref: '#/components/schemas/UnlinkDriverFromLegRequest'
*     responses:
*       200:
*         description: Driver unlinked
*         content:
*           application/json:
*             schema:
*               $ref: '#/components/schemas/UnlinkDriverFromLegResponse'
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
export const unlinkDriverFromTripLeg = async (req: Request, res: Response) => {
  try {
    const deep = req.query.deep === "true";
    const { tripId, leg } = req.body as any;
    if (!tripId || !leg) {
      return res.status(400).json({ message: "tripId and leg are required" });
    }
    const trip = await Trip.findById(tripId);
    if (!trip) return res.status(404).json({ message: "Trip not found" });
    const legIndex = leg - 1;
    if (legIndex < 0 || legIndex >= trip.route.length) {
      return res.status(400).json({ message: "Invalid leg number" });
    }
    (trip.route as any[])[legIndex].driver = undefined;
    await trip.save();
    const populated = deep
      ? await Trip.findById(trip._id)
          .populate("origin destination")
          .populate({ path: "route.driver" })
          .populate({ path: "route.association" })
          .populate({ path: "route.details", populate: ["fromRank", "toRank"] })
      : await Trip.findById(trip._id).populate("route.driver route.details");
    return res.status(200).json({ message: "Driver unlinked from leg successfully", trip: populated });
  } catch (error) {
    res.status(500).json({ message: "Error unlinking driver from leg", error });
  }
};
