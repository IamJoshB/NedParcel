import { Request, Response } from "express";
import TaxiAssociation from "../models/taxi-association.model";
import BankingDetails from "../models/banking-details.model"; 

/**
 * @swagger
 * tags:
 *   - name: TaxiAssociations
 *     description: Manage taxi associations and their linked banking details.
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
 *           example: 12A
 *         streetName:
 *           type: string
 *           example: Main Road
 *         city:
 *           type: string
 *           example: Johannesburg
 *         province:
 *           type: string
 *           example: Gauteng
 *         suburb:
 *           type: string
 *           example: Sandton
 *         postalCode:
 *           type: string
 *           example: 2196
 *       required:
 *         - streetNo
 *         - streetName
 *         - city
 *         - province
 *         - suburb
 *         - postalCode
 *     TaxiAssociation:
 *       type: object
 *       properties:
 *         _id:
 *           $ref: '#/components/schemas/ObjectId'
 *         name:
 *           type: string
 *           example: Central Taxi Association
 *         email:
 *           type: string
 *           format: email
 *           example: contact@cta.org
 *         password:
 *           type: string
 *           description: Hashed password (write-only)
 *         contactPerson:
 *           type: string
 *           example: Thabo Mokoena
 *         phone:
 *           type: string
 *           example: "+27115557777"
 *         address:
 *           $ref: '#/components/schemas/Address'
 *         bankingDetails:
 *           $ref: '#/components/schemas/ObjectId'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       required:
 *         - name
 *         - email
 *         - password
 *         - contactPerson
 *         - phone
 *         - address
 *     CreateTaxiAssociationRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *         contactPerson:
 *           type: string
 *         phone:
 *           type: string
 *         address:
 *           $ref: '#/components/schemas/Address'
 *       required:
 *         - name
 *         - email
 *         - password
 *         - contactPerson
 *         - phone
 *         - address
 *     UpdateTaxiAssociationRequest:
 *       type: object
 *       description: Partial update for taxi association fields.
 *       properties:
 *         name:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *         contactPerson:
 *           type: string
 *         phone:
 *           type: string
 *         address:
 *           $ref: '#/components/schemas/Address'
 *         bankingDetails:
 *           $ref: '#/components/schemas/ObjectId'
 *     LinkBankingDetailsRequest:
 *       type: object
 *       properties:
 *         associationId:
 *           $ref: '#/components/schemas/ObjectId'
 *         bankingDetailsId:
 *           $ref: '#/components/schemas/ObjectId'
 *       required:
 *         - associationId
 *         - bankingDetailsId
 *     UnlinkBankingDetailsRequest:
 *       type: object
 *       properties:
 *         associationId:
 *           $ref: '#/components/schemas/ObjectId'
 *       required:
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
 * /api/taxi-associations:
 *   post:
 *     summary: Create a Taxi Association
 *     description: Registers a new taxi association. Use ?shallow=true to omit population of bankingDetails in response.
 *     tags: [TaxiAssociations]
 *     operationId: createTaxiAssociation
 *     parameters:
 *       - in: query
 *         name: shallow
 *         schema:
 *           type: boolean
 *         description: If true, returns raw document without populated banking details.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTaxiAssociationRequest'
 *     responses:
 *       201:
 *         description: Taxi Association created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TaxiAssociation'
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
export const createTaxiAssociation = async (req: Request, res: Response) => {
  try {
    const newAssociation = await TaxiAssociation.create(req.body);
    res.status(201).json(newAssociation);
  } catch (error) {
    res.status(500).json({ message: "Error creating Taxi Association", error });
  }
};

/**
 * @swagger
 * /api/taxi-associations:
 *   get:
 *     summary: Get all Taxi Associations
 *     description: Returns all taxi associations. Use ?shallow=true to omit population of bankingDetails.
 *     tags: [TaxiAssociations]
 *     operationId: getAllTaxiAssociations
 *     parameters:
 *       - in: query
 *         name: shallow
 *         schema:
 *           type: boolean
 *         description: If true, returns raw documents without populated banking details.
 *     responses:
 *       200:
 *         description: List of taxi associations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TaxiAssociation'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const getAllTaxiAssociations = async (_req: Request, res: Response) => {
  try {
    const associations = await TaxiAssociation.find().populate(
      "bankingDetails"
    );
    res.status(200).json(associations);
  } catch (error) {
    res.status(500).json({ message: "Error getting Taxi Associations", error });
  }
};

/**
 * @swagger
 * /api/taxi-associations/{id}:
 *   get:
 *     summary: Get Taxi Association by ID
 *     description: Retrieves a single taxi association. Use ?shallow=true to omit population of bankingDetails.
 *     tags: [TaxiAssociations]
 *     operationId: getTaxiAssociationById
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 *         description: Taxi Association ID
 *       - in: query
 *         name: shallow
 *         schema:
 *           type: boolean
 *         description: If true, returns raw document without populated banking details.
 *     responses:
 *       200:
 *         description: Taxi Association found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TaxiAssociation'
 *       404:
 *         description: Taxi Association not found
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
export const getTaxiAssociationById = async (req: Request, res: Response) => {
  try {
    const association = await TaxiAssociation.findById(req.params.id).populate(
      "bankingDetails"
    );
    if (!association) {
      return res.status(404).json({ message: "Taxi Association not found" });
    }
    res.status(200).json(association);
  } catch (error) {
    res.status(500).json({ message: "Error getting Taxi Association", error });
  }
};

/**
 * @swagger
 * /api/taxi-associations/{id}:
 *   put:
 *     summary: Update a Taxi Association
 *     description: Partially updates association fields. Use ?shallow=true to omit population of bankingDetails in response.
 *     tags: [TaxiAssociations]
 *     operationId: updateTaxiAssociation
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 *         description: Taxi Association ID
 *       - in: query
 *         name: shallow
 *         schema:
 *           type: boolean
 *         description: If true, returns raw document without populated banking details.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTaxiAssociationRequest'
 *     responses:
 *       200:
 *         description: Taxi Association updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TaxiAssociation'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Taxi Association not found
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
export const updateTaxiAssociation = async (req: Request, res: Response) => {
  try {
    const updated = await TaxiAssociation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ message: "Taxi Association not found" });
    }
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: "Error updating TaxiAssociation", error });
  }
};

/**
 * @swagger
 * /api/taxi-associations/{id}:
 *   delete:
 *     summary: Delete a Taxi Association
 *     description: Permanently removes a taxi association.
 *     tags: [TaxiAssociations]
 *     operationId: deleteTaxiAssociation
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 *         description: Taxi Association ID
 *       - in: query
 *         name: shallow
 *         schema:
 *           type: boolean
 *         description: If true, skips population (useful for lightweight confirmation).
 *     responses:
 *       200:
 *         description: Taxi Association deleted successfully
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
 *         description: Taxi Association not found
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
export const deleteTaxiAssociation = async (req: Request, res: Response) => {
  try {
    const deleted = await TaxiAssociation.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Taxi Association not found" });
    }
    res.status(200).json({ message: "Taxi Association deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting Taxi Association", error });
  }
};

/**
 * @swagger
 * /api/taxi-associations/link-banking:
 *   post:
 *     summary: Link BankingDetails to Taxi Association
 *     description: Associates existing banking details document to an association. Use ?shallow=true to omit population of bankingDetails in response.
 *     tags: [TaxiAssociations]
 *     operationId: linkBankingDetailsForAssociation
 *     parameters:
 *       - in: query
 *         name: shallow
 *         schema:
 *           type: boolean
 *         description: If true, returns association without populated banking details.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LinkBankingDetailsRequest'
 *     responses:
 *       200:
 *         description: Banking details linked
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TaxiAssociation'
 *       404:
 *         description: Association or Banking details not found
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
export const linkBankingDetails = async (req: Request, res: Response) => {
  try {
    const { associationId, bankingDetailsId } = req.body;

    const bankingDetails = await BankingDetails.findById(bankingDetailsId);
    if (!bankingDetails) {
      return res.status(404).json({ message: "Banking Details not found" });
    }

    const updated = await TaxiAssociation.findByIdAndUpdate(
      associationId,
      { bankingDetails: bankingDetailsId },
      { new: true }
    ).populate("bankingDetails");

    if (!updated) {
      return res.status(404).json({ message: "Taxi Association not found" });
    }

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: "Error linking Banking Details", error });
  }
};

/**
 * @swagger
 * /api/taxi-associations/unlink-banking:
 *   post:
 *     summary: Unlink BankingDetails from Taxi Association
 *     description: Removes existing banking details link. Use ?shallow=true to omit population in response.
 *     tags: [TaxiAssociations]
 *     operationId: unlinkBankingDetailsForAssociation
 *     parameters:
 *       - in: query
 *         name: shallow
 *         schema:
 *           type: boolean
 *         description: If true, returns association without populated banking details.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UnlinkBankingDetailsRequest'
 *     responses:
 *       200:
 *         description: Banking details unlinked
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TaxiAssociation'
 *       404:
 *         description: Taxi Association not found
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
export const unlinkBankingDetails = async (req: Request, res: Response) => {
  try {
    const { associationId } = req.body;

    const updated = await TaxiAssociation.findByIdAndUpdate(
      associationId,
      { $unset: { bankingDetails: "" } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Taxi Association not found" });
    }

    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: "Error unlinking Banking Details", error });
  }
};

/**
 * @swagger
 * /api/taxi-associations/filtering-values:
 *   get:
 *     summary: Get filtering values for Taxi Associations
 *     description: Returns id + name pairs for associations.
 *     tags: [TaxiAssociations]
 *     operationId: getTaxiAssociationFilteringValues
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
export const getTaxiAssociationFilteringValues = async (_req: Request, res: Response) => {
  try {
    const docs = await TaxiAssociation.find({}, "name");
    res.status(200).json(docs.map((d) => ({ id: d._id, name: d.name })));
  } catch (error) {
    res.status(500).json({ message: "Error getting filtering values", error });
  }
};
