import { Request, Response } from "express";
import Marshall from "../models/marshall-details.model";

/**
 * @swagger
 * tags:
 *   - name: Marshalls
 *     description: Manage marshal personnel and their linked resources.
 * components:
 *   schemas:
 *     ObjectId:
 *       type: string
 *       description: MongoDB ObjectId
 *       example: 6510d2f4a1c2b3001234abcd
 *     Marshall:
 *       type: object
 *       properties:
 *         _id:
 *           $ref: '#/components/schemas/ObjectId'
 *         firstName:
 *           type: string
 *           example: Sipho
 *         lastName:
 *           type: string
 *           example: Dlamini
 *         phone:
 *           type: string
 *           example: +27 82 123 4567
 *         linkedRank:
 *           $ref: '#/components/schemas/ObjectId'
 *         taxiAssociation:
 *           $ref: '#/components/schemas/ObjectId'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       required:
 *         - firstName
 *         - lastName
 *         - phone
 *     CreateMarshallRequest:
 *       type: object
 *       properties:
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         phone:
 *           type: string
 *       required:
 *         - firstName
 *         - lastName
 *         - phone
 *     UpdateMarshallRequest:
 *       type: object
 *       description: Partial update of marshall fields.
 *       properties:
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         phone:
 *           type: string
 *         linkedRank:
 *           $ref: '#/components/schemas/ObjectId'
 *         taxiAssociation:
 *           $ref: '#/components/schemas/ObjectId'
 *     LinkTaxiRankRequest:
 *       type: object
 *       properties:
 *         marshallId:
 *           $ref: '#/components/schemas/ObjectId'
 *         taxiRankId:
 *           $ref: '#/components/schemas/ObjectId'
 *       required:
 *         - marshallId
 *         - taxiRankId
 *     UnlinkTaxiRankRequest:
 *       type: object
 *       properties:
 *         marshallId:
 *           $ref: '#/components/schemas/ObjectId'
 *       required:
 *         - marshallId
 *     UnlinkBankingDetailsRequest:
 *       type: object
 *       properties:
 *         marshallId:
 *           $ref: '#/components/schemas/ObjectId'
 *       required:
 *         - marshallId
 *     LinkTaxiAssociationRequest:
 *       type: object
 *       properties:
 *         marshallId:
 *           $ref: '#/components/schemas/ObjectId'
 *         taxiAssociationId:
 *           $ref: '#/components/schemas/ObjectId'
 *       required:
 *         - marshallId
 *         - taxiAssociationId
 *     UnlinkTaxiAssociationRequest:
 *       type: object
 *       properties:
 *         marshallId:
 *           $ref: '#/components/schemas/ObjectId'
 *       required:
 *         - marshallId
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
 * /api/marshall-details:
 *   post:
 *     summary: Create a Marshall
 *     description: Registers a new marshall.
 *     tags: [Marshalls]
 *     operationId: createMarshall
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateMarshallRequest'
 *     responses:
 *       201:
 *         description: Marshall created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Marshall'
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
export const createMarshall = async (req: Request, res: Response) => {
  try {
    const marshall = new Marshall(req.body);
    const savedMarshall = await marshall.save();
    const populated = await Marshall.findById(savedMarshall._id)
      .populate("linkedRank")
      .populate("taxiAssociation");
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: "Error creating marshall", error });
  }
};

/**
 * @swagger
 * /api/marshall-details:
 *   get:
 *     summary: Get all Marshalls
 *     description: Returns all marshalls with populated linked resources.
 *     tags: [Marshalls]
 *     operationId: getAllMarshalls
 *     responses:
 *       200:
 *         description: List of marshalls
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Marshall'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const getAllMarshalls = async (_req: Request, res: Response) => {
  try {
    const marshalls = await Marshall.find()
      .populate("linkedRank")
      .populate("taxiAssociation");
    res.status(200).json(marshalls);
  } catch (error) {
    res.status(500).json({ message: "Error getting marshalls", error });
  }
};

/**
 * @swagger
 * /api/marshall-details/{id}:
 *   get:
 *     summary: Get a Marshall by ID
 *     description: Retrieves a single marshall with populated relations.
 *     tags: [Marshalls]
 *     operationId: getMarshallById
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 *         description: Marshall ID
 *     responses:
 *       200:
 *         description: Marshall found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Marshall'
 *       404:
 *         description: Marshall not found
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
export const getMarshallById = async (req: Request, res: Response) => {
  try {
    const marshall = await Marshall.findById(req.params.id)
      .populate("linkedRank")
      .populate("taxiAssociation");
    if (!marshall) {
      return res.status(404).json({ message: "Marshall not found" });
    }
    res.status(200).json(marshall);
  } catch (error) {
    res.status(500).json({ message: "Error getting marshall", error });
  }
};

/**
 * @swagger
 * /api/marshall-details/{id}:
 *   put:
 *     summary: Update a Marshall
 *     description: Partially or fully updates a marshall.
 *     tags: [Marshalls]
 *     operationId: updateMarshall
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 *         description: Marshall ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateMarshallRequest'
 *     responses:
 *       200:
 *         description: Marshall updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Marshall'
 *       404:
 *         description: Marshall not found
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
export const updateMarshall = async (req: Request, res: Response) => {
  try {
    const updatedMarshall = await Marshall.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedMarshall) {
      return res.status(404).json({ message: "Marshall not found" });
    }
    const populated = await Marshall.findById(updatedMarshall._id)
      .populate("linkedRank")
      .populate("taxiAssociation");
    res.status(200).json(populated);
  } catch (error) {
    res.status(500).json({ message: "Error updating marshall", error });
  }
};

/**
 * @swagger
 * /api/marshall-details/{id}:
 *   delete:
 *     summary: Delete a Marshall
 *     description: Permanently removes a marshall.
 *     tags: [Marshalls]
 *     operationId: deleteMarshall
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 *         description: Marshall ID
 *     responses:
 *       200:
 *         description: Marshall deleted
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
 *         description: Marshall not found
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
export const deleteMarshall = async (req: Request, res: Response) => {
  try {
    const deletedMarshall = await Marshall.findByIdAndDelete(req.params.id);
    if (!deletedMarshall) {
      return res.status(404).json({ message: "Marshall not found" });
    }
    res.status(200).json({ message: "Marshall deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting marshall", error });
  }
};

/**
 * @swagger
 * /api/marshall-details/link-rank:
 *   post:
 *     summary: Link Taxi Rank
 *     description: Links a taxi rank to a marshall.
 *     tags: [Marshalls]
 *     operationId: linkTaxiRank
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LinkTaxiRankRequest'
 *     responses:
 *       200:
 *         description: Taxi rank linked
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Marshall'
 *       404:
 *         description: Marshall not found
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
export const linkTaxiRank = async (req: Request, res: Response) => {
  try {
    const { marshallId, taxiRankId } = req.body;

    const updated = await Marshall.findByIdAndUpdate(
      marshallId,
      { linkedRank: taxiRankId },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ message: "Marshall not found" });
    }
    const populated = await Marshall.findById(updated._id)
      .populate("linkedRank")
      .populate("taxiAssociation");
    res.status(200).json(populated);
  } catch (error) {
    res.status(500).json({ message: "Error linking TaxiRank", error });
  }
};

/**
 * @swagger
 * /api/marshall-details/unlink-rank:
 *   post:
 *     summary: Unlink Taxi Rank
 *     description: Removes a linked taxi rank from a marshall.
 *     tags: [Marshalls]
 *     operationId: unlinkTaxiRank
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UnlinkTaxiRankRequest'
 *     responses:
 *       200:
 *         description: Taxi rank unlinked
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Marshall'
 *       404:
 *         description: Marshall not found
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
export const unlinkTaxiRank = async (req: Request, res: Response) => {
  try {
    const { marshallId } = req.body;

    const updated = await Marshall.findByIdAndUpdate(
      marshallId,
      { $unset: { linkedRank: "" } },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ message: "Marshall not found" });
    }
    const populated = await Marshall.findById(updated._id)
      .populate("linkedRank")
      .populate("taxiAssociation");
    res.status(200).json(populated);
  } catch (error) {
    res.status(500).json({ message: "Error unlinking TaxiRank", error });
  }
};

/**
 * @swagger
 * /api/marshall-details/link-association:
 *   post:
 *     summary: Link Taxi Association
 *     description: Links a taxi association to a marshall.
 *     tags: [Marshalls]
 *     operationId: linkTaxiAssociation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LinkTaxiAssociationRequest'
 *     responses:
 *       200:
 *         description: Taxi association linked
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Marshall'
 *       404:
 *         description: Marshall not found
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
export const linkTaxiAssociation = async (req: Request, res: Response) => {
  try {
    const { marshallId, taxiAssociationId } = req.body;

    const updated = await Marshall.findByIdAndUpdate(
      marshallId,
      { taxiAssociation: taxiAssociationId },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ message: "Marshall not found" });
    }
    const populated = await Marshall.findById(updated._id)
      .populate("linkedRank")
      .populate("taxiAssociation");
    res.status(200).json(populated);
  } catch (error) {
    res.status(500).json({ message: "Error linking TaxiAssociation", error });
  }
};

/**
 * @swagger
 * /api/marshall-details/unlink-association:
 *   post:
 *     summary: Unlink Taxi Association
 *     description: Removes a linked taxi association from a marshall.
 *     tags: [Marshalls]
 *     operationId: unlinkTaxiAssociation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UnlinkTaxiAssociationRequest'
 *     responses:
 *       200:
 *         description: Taxi association unlinked
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Marshall'
 *       404:
 *         description: Marshall not found
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
export const unlinkTaxiAssociation = async (req: Request, res: Response) => {
  try {
    const { marshallId } = req.body;

    const updated = await Marshall.findByIdAndUpdate(
      marshallId,
      { $unset: { taxiAssociation: "" } },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ message: "Marshall not found" });
    }
    const populated = await Marshall.findById(updated._id)
      .populate("linkedRank")
      .populate("taxiAssociation");
    res.status(200).json(populated);
  } catch (error) {
    res.status(500).json({ message: "Error unlinking TaxiAssociation", error });
  }
};

/**
 * @swagger
 * /api/marshall-details/filtering-values:
 *   get:
 *     summary: Get filtering values for Marshalls
 *     description: Returns id + full name for each marshall.
 *     tags: [Marshalls]
 *     operationId: getMarshallFilteringValues
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
export const getMarshallFilteringValues = async (_req: Request, res: Response) => {
  try {
    const docs = await Marshall.find({}, "firstName lastName");
    res.status(200).json(docs.map((d) => ({ id: d._id, name: `${d.firstName} ${d.lastName}`.trim() })));
  } catch (error) {
    res.status(500).json({ message: "Error getting filtering values", error });
  }
};
