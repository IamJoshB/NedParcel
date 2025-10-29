import { Request, Response } from "express";
import TaxiRank from "../models/taxi-rank.model";
import PossibleRoute from "../models/possible-routes.model";

/**
 * @swagger
 * tags:
 *   - name: TaxiRanks
 *     description: Manage taxi ranks, destinations and associated taxi associations.
 * components:
 *   schemas:
 *     ObjectId:
 *       type: string
 *       description: MongoDB ObjectId
 *       example: 650f0f3c2a5e4d001234abcd
 *     Address:
 *       type: object
 *       properties:
 *         streetNo:
 *           type: string
 *           example: 15
 *         streetName:
 *           type: string
 *           example: Commissioner Street
 *         city:
 *           type: string
 *           example: Johannesburg
 *         province:
 *           type: string
 *           example: Gauteng
 *         suburb:
 *           type: string
 *           example: CBD
 *         postalCode:
 *           type: string
 *           example: 2001
 *       required:
 *         - streetNo
 *         - streetName
 *         - city
 *         - province
 *         - suburb
 *         - postalCode
 *     TaxiRank:
 *       type: object
 *       properties:
 *         _id:
 *           $ref: '#/components/schemas/ObjectId'
 *         name:
 *           type: string
 *           example: Bree Taxi Rank
 *         location:
 *           type: string
 *           example: -26.2041,28.0473
 *         address:
 *           $ref: '#/components/schemas/Address'
 *         possibleRoutes:
 *           type: array
 *           description: List of route IDs originating from this rank.
 *           items:
 *             $ref: '#/components/schemas/ObjectId'
 *         taxiAssociations:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ObjectId'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       required:
 *         - name
 *         - location
 *         - address
 *     CreateTaxiRankRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         location:
 *           type: string
 *         address:
 *           $ref: '#/components/schemas/Address'
 *       required:
 *         - name
 *         - location
 *         - address
 *     UpdateTaxiRankRequest:
 *       type: object
 *       description: Partial update for taxi rank fields.
 *       properties:
 *         name:
 *           type: string
 *         location:
 *           type: string
 *         address:
 *           $ref: '#/components/schemas/Address'
 *         possibleRoutes:
 *           type: array
 *           description: Override list of route IDs (normally managed via link/unlink operations).
 *           items:
 *             $ref: '#/components/schemas/ObjectId'
 *         taxiAssociations:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ObjectId'
 *     LinkDestinationRequest:
 *       type: object
 *       properties:
 *         taxiRankId:
 *           $ref: '#/components/schemas/ObjectId'
 *         destinationRankId:
 *           $ref: '#/components/schemas/ObjectId'
 *         farePrice:
 *           type: number
 *           example: 25.5
 *         distance:
 *           type: number
 *           example: 12.3
 *       required:
 *         - taxiRankId
 *         - destinationRankId
 *         - farePrice
 *         - distance
 *     UnlinkDestinationRequest:
 *       type: object
 *       properties:
 *         taxiRankId:
 *           $ref: '#/components/schemas/ObjectId'
 *         destinationRankId:
 *           $ref: '#/components/schemas/ObjectId'
 *       required:
 *         - taxiRankId
 *         - destinationRankId
 *     LinkAssociationRequest:
 *       type: object
 *       properties:
 *         taxiRankId:
 *           $ref: '#/components/schemas/ObjectId'
 *         associationId:
 *           $ref: '#/components/schemas/ObjectId'
 *       required:
 *         - taxiRankId
 *         - associationId
 *     UnlinkAssociationRequest:
 *       type: object
 *       properties:
 *         taxiRankId:
 *           $ref: '#/components/schemas/ObjectId'
 *         associationId:
 *           $ref: '#/components/schemas/ObjectId'
 *       required:
 *         - taxiRankId
 *         - associationId
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
 * /api/taxi-ranks:
 *   post:
 *     summary: Create a Taxi Rank
 *     description: Registers a taxi rank. Use ?shallow=true to return rank without deep population of routes & associations.
 *     tags: [TaxiRanks]
 *     operationId: createTaxiRank
 *     parameters:
 *       - in: query
 *         name: shallow
 *         schema:
 *           type: boolean
 *         description: If true, omits deep population of possibleRoutes(fromRank,toRank) and taxiAssociations(bankingDetails).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTaxiRankRequest'
 *     responses:
 *       201:
 *         description: Taxi rank created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TaxiRank'
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
// Create a TaxiRank
export const createTaxiRank = async (req: Request, res: Response) => {
  try {
    const taxiRank = new TaxiRank(req.body);
    const savedRank = await taxiRank.save();
    const shallow = req.query.shallow === "true";
    const populated = shallow
      ? savedRank
      : await TaxiRank.findById(savedRank._id)
          .populate({ path: "possibleRoutes", populate: ["fromRank", "toRank"] })
          .populate({ path: "taxiAssociations", populate: { path: "bankingDetails" } });
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: "Error creating taxi rank", error });
  }
};

/**
 * @swagger
 * /api/taxi-ranks:
 *   get:
 *     summary: Get all Taxi Ranks
 *     description: Returns all taxi ranks. Use ?shallow=true to omit deep population of possibleRoutes(fromRank,toRank) and taxiAssociations(bankingDetails).
 *     tags: [TaxiRanks]
 *     operationId: getAllTaxiRanks
 *     parameters:
 *       - in: query
 *         name: shallow
 *         schema:
 *           type: boolean
 *         description: If true, performs shallow population (only route IDs and association IDs without nested documents).
 *     responses:
 *       200:
 *         description: List of taxi ranks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TaxiRank'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// Get all TaxiRanks
export const getAllTaxiRanks = async (req: Request, res: Response) => {
  try {
    const shallow = req.query.shallow === "true";
    const ranks = shallow
      ? await TaxiRank.find().populate("possibleRoutes")
      : await TaxiRank.find()
          .populate({ path: "possibleRoutes", populate: ["fromRank", "toRank"] })
          .populate({ path: "taxiAssociations", populate: { path: "bankingDetails" } });
    res.status(200).json(ranks);
  } catch (error) {
    res.status(500).json({ message: "Error getting taxi ranks", error });
  }
};

/**
 * @swagger
 * /api/taxi-ranks/{id}:
 *   get:
 *     summary: Get a Taxi Rank by ID
 *     description: Retrieves a single taxi rank. Use ?shallow=true to omit deep population of possibleRoutes(fromRank,toRank) and taxiAssociations(bankingDetails).
 *     tags: [TaxiRanks]
 *     operationId: getTaxiRankById
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 *         description: Taxi Rank ID
 *       - in: query
 *         name: shallow
 *         schema:
 *           type: boolean
 *         description: If true, omits deep population of nested route & association documents.
 *     responses:
 *       200:
 *         description: Taxi rank found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TaxiRank'
 *       404:
 *         description: Taxi rank not found
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
// Get a single TaxiRank by ID
export const getTaxiRankById = async (req: Request, res: Response) => {
  try {
    const shallow = req.query.shallow === "true";
    const rank = shallow
      ? await TaxiRank.findById(req.params.id).populate("possibleRoutes").populate("taxiAssociations")
      : await TaxiRank.findById(req.params.id)
          .populate({ path: "possibleRoutes", populate: ["fromRank", "toRank"] })
          .populate({ path: "taxiAssociations", populate: { path: "bankingDetails" } });
    if (!rank) return res.status(404).json({ message: "Taxi rank not found" });
    res.status(200).json(rank);
  } catch (error) {
    res.status(500).json({ message: "Error getting taxi rank", error });
  }
};

/**
 * @swagger
 * /api/taxi-ranks/{id}:
 *   put:
 *     summary: Update a Taxi Rank
 *     description: Partially updates a taxi rank. Use ?shallow=true to return non-deep populated response.
 *     tags: [TaxiRanks]
 *     operationId: updateTaxiRank
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 *         description: Taxi Rank ID
 *       - in: query
 *         name: shallow
 *         schema:
 *           type: boolean
 *         description: If true, omits deep population of nested route & association documents.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTaxiRankRequest'
 *     responses:
 *       200:
 *         description: Taxi rank updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TaxiRank'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Taxi rank not found
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
// Update a TaxiRank
export const updateTaxiRank = async (req: Request, res: Response) => {
  try {
    const updatedRank = await TaxiRank.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
      }
    );
    if (!updatedRank)
      return res.status(404).json({ message: "Taxi rank not found" });
    res.status(200).json(updatedRank);
  } catch (error) {
    res.status(500).json({ message: "Error updating taxi rank", error });
  }
};

/**
 * @swagger
 * /api/taxi-ranks/{id}:
 *   delete:
 *     summary: Delete a Taxi Rank
 *     description: Permanently removes a taxi rank.
 *     tags: [TaxiRanks]
 *     operationId: deleteTaxiRank
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 *         description: Taxi Rank ID
 *       - in: query
 *         name: shallow
 *         schema:
 *           type: boolean
 *         description: If true, omits deep population (useful just to confirm deletion).
 *     responses:
 *       200:
 *         description: Taxi rank deleted
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
 *         description: Taxi rank not found
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
// Delete a TaxiRank
export const deleteTaxiRank = async (req: Request, res: Response) => {
  try {
    const deletedRank = await TaxiRank.findByIdAndDelete(req.params.id);
    if (!deletedRank)
      return res.status(404).json({ message: "Taxi rank not found" });
    res.status(200).json({ message: "Taxi rank deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting taxi rank", error });
  }
};

/**
 * @swagger
 * /api/taxi-ranks/link-destination:
 *   post:
 *     summary: Link a destination Taxi Rank
 *     description: Adds a destination rank to the taxi rank's destination list by creating a PossibleRoute (fromRank -> toRank). Reverse routes are not auto-created; link again with swapped ranks to add reverse. Use ?shallow=true to return non-deep populated rank.
 *     tags: [TaxiRanks]
 *     operationId: linkDestinationRank
 *     parameters:
 *       - in: query
 *         name: shallow
 *         schema:
 *           type: boolean
 *         description: If true, omits deep population of newly added route details.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LinkDestinationRequest'
 *     responses:
 *       200:
 *         description: Destination rank linked
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TaxiRank'
 *       404:
 *         description: Taxi rank not found
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
// Link a destination TaxiRank
export const linkDestinationRank = async (req: Request, res: Response) => {
  try {
    const { taxiRankId, destinationRankId, farePrice, distance } = req.body;

    // Validate base rank
    const baseRank = await TaxiRank.findById(taxiRankId);
    if (!baseRank) return res.status(404).json({ message: "Taxi rank not found" });

    // Ensure destination rank exists
    const destRank = await TaxiRank.findById(destinationRankId);
    if (!destRank) return res.status(404).json({ message: "Destination rank not found" });

    // Create route
    const route = new PossibleRoute({
      farePrice,
      distance,
      fromRank: taxiRankId,
      toRank: destinationRankId,
    });
    const savedRoute = await route.save();

    // Attach route to base rank
    baseRank.possibleRoutes = baseRank.possibleRoutes || [];
    (baseRank.possibleRoutes as any).push(savedRoute._id);
    await baseRank.save();

    // Return populated rank
    const populated = await TaxiRank.findById(taxiRankId).populate({
      path: "possibleRoutes",
      populate: ["fromRank", "toRank"],
    }).populate("taxiAssociations");
    res.status(200).json(populated);
  } catch (error) {
    res.status(500).json({ message: "Error linking destination rank", error });
  }
};

/**
 * @swagger
 * /api/taxi-ranks/unlink-destination:
 *   post:
 *     summary: Unlink a destination Taxi Rank
 *     description: Removes a destination rank by deleting the PossibleRoute document (fromRank -> toRank). Does not affect any reverse route. Use ?shallow=true to return non-deep populated rank.
 *     tags: [TaxiRanks]
 *     operationId: unlinkDestinationRank
 *     parameters:
 *       - in: query
 *         name: shallow
 *         schema:
 *           type: boolean
 *         description: If true, omits deep population of remaining routes.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UnlinkDestinationRequest'
 *     responses:
 *       200:
 *         description: Destination rank unlinked
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TaxiRank'
 *       404:
 *         description: Taxi rank not found
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
// Unlink a destination TaxiRank
export const unlinkDestinationRank = async (req: Request, res: Response) => {
  try {
    const { taxiRankId, destinationRankId } = req.body;

    const baseRank = await TaxiRank.findById(taxiRankId);
    if (!baseRank) return res.status(404).json({ message: "Taxi rank not found" });

    // Find route document matching fromRank/toRank
    const route = await PossibleRoute.findOne({
      fromRank: taxiRankId,
      toRank: destinationRankId,
    });
    if (!route) return res.status(404).json({ message: "Route not found" });

    // Remove route id from possibleRoutes
    await TaxiRank.findByIdAndUpdate(taxiRankId, {
      $pull: { possibleRoutes: route._id },
    });

    // Delete route document
    await PossibleRoute.findByIdAndDelete(route._id);

    const populated = await TaxiRank.findById(taxiRankId).populate({
      path: "possibleRoutes",
      populate: ["fromRank", "toRank"],
    }).populate("taxiAssociations");
    res.status(200).json(populated);
  } catch (error) {
    res.status(500).json({ message: "Error unlinking destination rank", error });
  }
};

/**
 * @swagger
 * /api/taxi-ranks/link-association:
 *   post:
 *     summary: Link a Taxi Association
 *     description: Adds an association to the taxi rank's associations list. Use ?shallow=true to return response without nested bankingDetails.
 *     tags: [TaxiRanks]
 *     operationId: linkTaxiAssociation
 *     parameters:
 *       - in: query
 *         name: shallow
 *         schema:
 *           type: boolean
 *         description: If true, omits deep population of associations' banking details.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LinkAssociationRequest'
 *     responses:
 *       200:
 *         description: Taxi association linked
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TaxiRank'
 *       404:
 *         description: Taxi rank not found
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
// Link a TaxiAssociation
export const linkTaxiAssociation = async (req: Request, res: Response) => {
  try {
    const { taxiRankId, associationId } = req.body;
    const rank = await TaxiRank.findByIdAndUpdate(
      taxiRankId,
      { $addToSet: { taxiAssociations: associationId } },
      { new: true }
    );
    if (!rank) return res.status(404).json({ message: "Taxi rank not found" });
    res.status(200).json(rank);
  } catch (error) {
    res.status(500).json({ message: "Error linking taxi association", error });
  }
};

/**
 * @swagger
 * /api/taxi-ranks/unlink-association:
 *   post:
 *     summary: Unlink a Taxi Association
 *     description: Removes an association from the taxi rank's associations list. Use ?shallow=true to return response without nested bankingDetails.
 *     tags: [TaxiRanks]
 *     operationId: unlinkTaxiAssociation
 *     parameters:
 *       - in: query
 *         name: shallow
 *         schema:
 *           type: boolean
 *         description: If true, omits deep population of associations' banking details.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UnlinkAssociationRequest'
 *     responses:
 *       200:
 *         description: Taxi association unlinked
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TaxiRank'
 *       404:
 *         description: Taxi rank not found
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
// Unlink a TaxiAssociation
export const unlinkTaxiAssociation = async (req: Request, res: Response) => {
  try {
    const { taxiRankId, associationId } = req.body;
    const rank = await TaxiRank.findByIdAndUpdate(
      taxiRankId,
      { $pull: { taxiAssociations: associationId } },
      { new: true }
    );
    if (!rank) return res.status(404).json({ message: "Taxi rank not found" });
    res.status(200).json(rank);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error unlinking taxi association", error });
  }
};

/**
 * @swagger
 * /api/taxi-ranks/filtering-values:
 *   get:
 *     summary: Get filtering values for Taxi Ranks
 *     description: Returns id + name for each taxi rank.
 *     tags: [TaxiRanks]
 *     operationId: getTaxiRankFilteringValues
 *     responses:
 *       200:
 *         description: List of filtering values
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     $ref: '#/components/schemas/ObjectId'
 *                   name:
 *                     type: string
 *                 required:
 *                   - id
 *                   - name
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const getTaxiRankFilteringValues = async (_req: Request, res: Response) => {
  try {
    const docs = await TaxiRank.find({}, "name");
    res.status(200).json(docs.map((d) => ({ id: d._id, name: d.name })));
  } catch (error) {
    res.status(500).json({ message: "Error getting filtering values", error });
  }
};
