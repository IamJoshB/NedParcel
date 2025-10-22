import { Request, Response } from "express";
import BankingDetails from "../models/banking-details.model";

/**
 * @swagger
 * tags:
 *   - name: BankingDetails
 *     description: Manage banking details for drivers, marshalls, or associations.
 * components:
 *   schemas:
 *     ObjectId:
 *       type: string
 *       description: MongoDB ObjectId
 *       example: 6510d2f4a1c2b3001234abcd
 *     BankingDetails:
 *       type: object
 *       properties:
 *         _id:
 *           $ref: '#/components/schemas/ObjectId'
 *         accountHolder:
 *           type: string
 *           example: John Doe
 *         bankName:
 *           type: string
 *           example: First National Bank
 *         accountNumber:
 *           type: string
 *           example: 1234567890
 *         branchCode:
 *           type: string
 *           example: 250655
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       required:
 *         - accountHolder
 *         - bankName
 *         - accountNumber
 *         - branchCode
 *     CreateBankingDetailsRequest:
 *       type: object
 *       properties:
 *         accountHolder:
 *           type: string
 *         bankName:
 *           type: string
 *         accountNumber:
 *           type: string
 *         branchCode:
 *           type: string
 *       required:
 *         - accountHolder
 *         - bankName
 *         - accountNumber
 *         - branchCode
 *     UpdateBankingDetailsRequest:
 *       type: object
 *       description: Partial update of banking details.
 *       properties:
 *         accountHolder:
 *           type: string
 *         bankName:
 *           type: string
 *         accountNumber:
 *           type: string
 *         branchCode:
 *           type: string
 *     DeleteBankingDetailsResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: Banking detail deleted successfully
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
 * /api/banking-details:
 *   post:
 *     summary: Create Banking Details
 *     description: Registers a new banking details record.
 *     tags: [BankingDetails]
 *     operationId: createBankingDetail
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateBankingDetailsRequest'
 *     responses:
 *       201:
 *         description: Banking details created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BankingDetails'
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
export const createBankingDetail = async (req: Request, res: Response) => {
  try {
    const bankingDetail = new BankingDetails(req.body);
    const savedDetail = await bankingDetail.save();
    res.status(201).json(savedDetail);
  } catch (error) {
    res.status(400).json({ message: "Error creating banking detail", error });
  }
};

/**
 * @swagger
 * /api/banking-details:
 *   get:
 *     summary: Get all Banking Details
 *     description: Returns a list of all banking details records.
 *     tags: [BankingDetails]
 *     operationId: getAllBankingDetails
 *     responses:
 *       200:
 *         description: List of banking details
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BankingDetails'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const getAllBankingDetails = async (_req: Request, res: Response) => {
  try {
    const details = await BankingDetails.find();
    res.status(200).json(details);
  } catch (error) {
    res.status(500).json({ message: "Error fetching banking details", error });
  }
};

/**
 * @swagger
 * /api/banking-details/{id}:
 *   get:
 *     summary: Get Banking Details by ID
 *     description: Retrieves a banking details record.
 *     tags: [BankingDetails]
 *     operationId: getBankingDetailById
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 *         description: Banking details ID
 *     responses:
 *       200:
 *         description: Banking details record found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BankingDetails'
 *       404:
 *         description: Record not found
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
export const getBankingDetailById = async (req: Request, res: Response) => {
  try {
    const detail = await BankingDetails.findById(req.params.id);
    if (!detail) {
      return res.status(404).json({ message: "Banking detail not found" });
    }
    res.status(200).json(detail);
  } catch (error) {
    res.status(500).json({ message: "Error fetching banking detail", error });
  }
};

/**
 * @swagger
 * /api/banking-details/{id}:
 *   put:
 *     summary: Update Banking Details
 *     description: Partially or fully updates banking details.
 *     tags: [BankingDetails]
 *     operationId: updateBankingDetail
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 *         description: Banking details ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateBankingDetailsRequest'
 *     responses:
 *       200:
 *         description: Banking details updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BankingDetails'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Record not found
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
export const updateBankingDetail = async (req: Request, res: Response) => {
  try {
    const updatedDetail = await BankingDetails.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedDetail) {
      return res.status(404).json({ message: "Banking detail not found" });
    }
    res.status(200).json(updatedDetail);
  } catch (error) {
    res.status(400).json({ message: "Error updating banking detail", error });
  }
};

/**
 * @swagger
 * /api/banking-details/{id}:
 *   delete:
 *     summary: Delete Banking Details
 *     description: Permanently removes a banking details record.
 *     tags: [BankingDetails]
 *     operationId: deleteBankingDetail
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 *         description: Banking details ID
 *     responses:
 *       200:
 *         description: Banking details deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeleteBankingDetailsResponse'
 *       404:
 *         description: Record not found
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
export const deleteBankingDetail = async (req: Request, res: Response) => {
  try {
    const deletedDetail = await BankingDetails.findByIdAndDelete(req.params.id);
    if (!deletedDetail) {
      return res.status(404).json({ message: "Banking detail not found" });
    }
    res.status(200).json({ message: "Banking detail deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting banking detail", error });
  }
};

/**
 * @swagger
 * /api/banking-details/filtering-values:
 *   get:
 *     summary: Get filtering values for Banking Details
 *     description: Returns id + accountNumber pairs for dropdown population.
 *     tags: [BankingDetails]
 *     operationId: getBankingDetailsFilteringValues
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
 *                   accountNumber:
 *                     type: string
 *                 required:
 *                   - id
 *                   - accountNumber
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const getBankingDetailsFilteringValues = async (_req: Request, res: Response) => {
  try {
    const docs = await BankingDetails.find({}, "accountNumber");
    res.status(200).json(docs.map((d) => ({ id: d._id, accountNumber: d.accountNumber })));
  } catch (error) {
    res.status(500).json({ message: "Error getting filtering values", error });
  }
};
