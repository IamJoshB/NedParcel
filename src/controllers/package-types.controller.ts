import { Request, Response } from "express";
import PackageType from "../models/package-type.model";

/**
 * @swagger
 * tags:
 *   - name: PackageTypes
 *     description: Manage available package types and their pricing constraints.
 * components:
 *   schemas:
 *     ObjectId:
 *       type: string
 *       description: MongoDB ObjectId
 *       example: 6510d2f4a1c2b3001234abcd
 *     PackageType:
 *       type: object
 *       description: Represents a category of package with SKU and pricing.
 *       properties:
 *         _id:
 *           $ref: '#/components/schemas/ObjectId'
 *         sku:
 *           type: string
 *           example: PKG-SMALL-001
 *         name:
 *           type: string
 *           example: Small Parcel
 *         price:
 *           type: number
 *           example: 49.99
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       required:
 *         - sku
 *         - name
 *         - price
 *     CreatePackageTypeRequest:
 *       type: object
 *       properties:
 *         sku:
 *           type: string
 *         name:
 *           type: string
 *         price:
 *           type: number
 *       required:
 *         - sku
 *         - name
 *         - price
 *     UpdatePackageTypeRequest:
 *       type: object
 *       description: Partial update for a package type.
 *       properties:
 *         sku:
 *           type: string
 *         name:
 *           type: string
 *         price:
 *           type: number
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
 * /api/package-types:
 *   post:
 *     summary: Create a Package Type
 *     description: Registers a new package type.
 *     tags: [PackageTypes]
 *     operationId: createPackageType
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePackageTypeRequest'
 *     responses:
 *       201:
 *         description: Package type created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PackageType'
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
export const createPackageType = async (req: Request, res: Response) => {
  try {
    const packageType = new PackageType(req.body);
    const saved = await packageType.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ message: "Error creating package type", error });
  }
};

/**
 * @swagger
 * /api/package-types:
 *   get:
 *     summary: Get all Package Types
 *     description: Returns all package types.
 *     tags: [PackageTypes]
 *     operationId: getAllPackageTypes
 *     responses:
 *       200:
 *         description: List of package types
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PackageType'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const getAllPackageTypes = async (_req: Request, res: Response) => {
  try {
    const types = await PackageType.find();
    res.status(200).json(types);
  } catch (error) {
    res.status(500).json({ message: "Error getting package types", error });
  }
};

/**
 * @swagger
 * /api/package-types/{id}:
 *   get:
 *     summary: Get a Package Type by ID
 *     description: Retrieves a single package type.
 *     tags: [PackageTypes]
 *     operationId: getPackageTypeById
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 *         description: Package type ID
 *     responses:
 *       200:
 *         description: Package type found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PackageType'
 *       404:
 *         description: Package type not found
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
export const getPackageTypeById = async (req: Request, res: Response) => {
  try {
    const type = await PackageType.findById(req.params.id);
    if (!type) return res.status(404).json({ message: "Package type not found" });
    res.status(200).json(type);
  } catch (error) {
    res.status(500).json({ message: "Error getting package type", error });
  }
};

/**
 * @swagger
 * /api/package-types/{id}:
 *   put:
 *     summary: Update a Package Type
 *     description: Partially or fully updates a package type.
 *     tags: [PackageTypes]
 *     operationId: updatePackageType
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 *         description: Package type ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePackageTypeRequest'
 *     responses:
 *       200:
 *         description: Package type updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PackageType'
 *       404:
 *         description: Package type not found
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
export const updatePackageType = async (req: Request, res: Response) => {
  try {
    const updated = await PackageType.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Package type not found" });
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: "Error updating package type", error });
  }
};

/**
 * @swagger
 * /api/package-types/{id}:
 *   delete:
 *     summary: Delete a Package Type
 *     description: Permanently removes a package type.
 *     tags: [PackageTypes]
 *     operationId: deletePackageType
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 *         description: Package type ID
 *     responses:
 *       200:
 *         description: Package type deleted
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
 *         description: Package type not found
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
export const deletePackageType = async (req: Request, res: Response) => {
  try {
    const deleted = await PackageType.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Package type not found" });
    res.status(200).json({ message: "Package type deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting package type", error });
  }
};

/**
 * @swagger
 * /api/package-types/filtering-values:
 *   get:
 *     summary: Get filtering values for Package Types
 *     description: Returns id + name pairs for populating dropdowns.
 *     tags: [PackageTypes]
 *     operationId: getPackageTypeFilteringValues
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
export const getPackageTypeFilteringValues = async (_req: Request, res: Response) => {
  try {
    const docs = await PackageType.find({}, "name");
    res.status(200).json(docs.map((d) => ({ id: d._id, name: d.name })));
  } catch (error) {
    res.status(500).json({ message: "Error getting filtering values", error });
  }
};
