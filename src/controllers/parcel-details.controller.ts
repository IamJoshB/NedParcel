import { Request, Response } from "express";
import Parcel from "../models/parcel-details.model";

/**
 * @swagger
 * tags:
 *   - name: Parcels
 *     description: Manage parcel lifecycle from creation to delivery confirmation.
 * components:
 *   schemas:
 *     ObjectId:
 *       type: string
 *       description: MongoDB ObjectId
 *       example: 6510d2f4a1c2b3001234abcd
 *     ParcelStatus:
 *       type: string
 *       enum: [awaiting-pickup, in-transit, delivered, received]
 *     Parcel:
 *       type: object
 *       properties:
 *         _id:
 *           $ref: '#/components/schemas/ObjectId'
 *         trackingNumber:
 *           type: string
 *           example: TRK-20251019-0001
 *         senderIdNumber:
 *           type: string
 *           example: 8001015009087
 *         senderFirstName:
 *           type: string
 *           example: Thabo
 *         senderLastName:
 *           type: string
 *           example: Mokoena
 *         senderPhone:
 *           type: string
 *           example: +27 82 123 4567
 *         receiverPhone:
 *           type: string
 *           example: +27 73 987 6543
 *         receiverOtp:
 *           type: string
 *           example: 458912
 *         originRank:
 *           $ref: '#/components/schemas/ObjectId'
 *         destinationRank:
 *           $ref: '#/components/schemas/ObjectId'
 *         package:
 *           type: object
 *           properties:
 *             identifier:
 *               type: string
 *               example: PKG-ABC123
 *             type:
 *               $ref: '#/components/schemas/ObjectId'
 *           required:
 *             - identifier
 *             - type
 *         trip:
 *           $ref: '#/components/schemas/ObjectId'
 *         legIndex:
 *           type: integer
 *           example: 0
 *         possibleRoute:
 *           $ref: '#/components/schemas/ObjectId'
 *         status:
 *           $ref: '#/components/schemas/ParcelStatus'
 *         price:
 *           type: number
 *           example: 79.99
 *         notes:
 *           type: string
 *           example: Handle with care.
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       required:
 *         - trackingNumber
 *         - senderIdNumber
 *         - senderFirstName
 *         - senderLastName
 *         - senderPhone
 *         - receiverPhone
 *         - receiverOtp
 *         - originRank
 *         - destinationRank
 *         - package
 *         - status
 *         - price
 *     CreateParcelRequest:
 *       type: object
 *       properties:
 *         senderIdNumber:
 *           type: string
 *         senderFirstName:
 *           type: string
 *         senderLastName:
 *           type: string
 *         senderPhone:
 *           type: string
 *         receiverPhone:
 *           type: string
 *         originRank:
 *           $ref: '#/components/schemas/ObjectId'
 *         destinationRank:
 *           $ref: '#/components/schemas/ObjectId'
 *         package:
 *           type: object
 *           properties:
 *             identifier:
 *               type: string
 *             type:
 *               $ref: '#/components/schemas/ObjectId'
 *           required:
 *             - identifier
 *             - type
 *         price:
 *           type: number
 *         trip:
 *           $ref: '#/components/schemas/ObjectId'
 *         legIndex:
 *           type: integer
 *         possibleRoute:
 *           $ref: '#/components/schemas/ObjectId'
 *         notes:
 *           type: string
 *       required:
 *         - senderIdNumber
 *         - senderFirstName
 *         - senderLastName
 *         - senderPhone
 *         - receiverPhone
 *         - originRank
 *         - destinationRank
 *         - package
 *         - price
 *     UpdateParcelRequest:
 *       type: object
 *       description: Partial update of a parcel.
 *       properties:
 *         senderPhone:
 *           type: string
 *         receiverPhone:
 *           type: string
 *         possibleRoute:
 *           $ref: '#/components/schemas/ObjectId'
 *         price:
 *           type: number
 *         notes:
 *           type: string
 *     UpdateParcelStatusRequest:
 *       type: object
 *       properties:
 *         parcelId:
 *           $ref: '#/components/schemas/ObjectId'
 *         status:
 *           $ref: '#/components/schemas/ParcelStatus'
 *       required:
 *         - parcelId
 *         - status
 *     VerifyParcelOtpRequest:
 *       type: object
 *       properties:
 *         parcelId:
 *           $ref: '#/components/schemas/ObjectId'
 *         otp:
 *           type: string
 *       required:
 *         - parcelId
 *         - otp
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

function generateTrackingNumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `TRK-${y}${m}${d}-${rand}`;
}

/**
 * @swagger
 * /api/parcel-details:
 *   post:
 *     summary: Create a Parcel
 *     description: Registers a new parcel and generates tracking number & OTP.
 *     tags: [Parcels]
 *     operationId: createParcel
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateParcelRequest'
 *     responses:
 *       201:
 *         description: Parcel created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Parcel'
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
export const createParcel = async (req: Request, res: Response) => {
  try {
    const trackingNumber = generateTrackingNumber();
    const receiverOtp = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, "0");
    const parcel = new Parcel({
      trackingNumber,
      receiverOtp,
      status: "awaiting-pickup",
      ...req.body,
    });
    const saved = await parcel.save();
    const deep = req.query.deep === "true";
    const populated = deep
      ? await Parcel.findById(saved._id)
          .populate("originRank destinationRank possibleRoute")
          .populate("package.type")
          .populate({
            path: "trip",
            populate: [
              "origin",
              "destination",
              { path: "route.driver" },
              { path: "route.association" },
              { path: "route.details", populate: ["fromRank", "toRank"] },
            ],
          })
      : saved;
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: "Error creating parcel", error });
  }
};

/**
 * @swagger
 * /api/parcel-details:
 *   get:
 *     summary: Get all Parcels
 *     description: Returns all parcels with populated refs.
 *     tags: [Parcels]
 *     operationId: getAllParcels
 *     responses:
 *       200:
 *         description: List of parcels
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Parcel'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const getAllParcels = async (req: Request, res: Response) => {
  try {
    const deep = req.query.deep === "true";
    const parcels = deep
      ? await Parcel.find()
          .populate("originRank destinationRank possibleRoute")
          .populate("package.type")
          .populate({
            path: "trip",
            populate: [
              "origin",
              "destination",
              { path: "route.driver" },
              { path: "route.association" },
              { path: "route.details", populate: ["fromRank", "toRank"] },
            ],
          })
      : await Parcel.find()
          .populate("originRank destinationRank trip possibleRoute")
          .populate("package.type");
    res.status(200).json(parcels);
  } catch (error) {
    res.status(500).json({ message: "Error getting parcels", error });
  }
};

/**
 * @swagger
 * /api/parcel-details/{id}:
 *   get:
 *     summary: Get a Parcel by ID
 *     description: Retrieves a single parcel.
 *     tags: [Parcels]
 *     operationId: getParcelById
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 *         description: Parcel ID
 *     responses:
 *       200:
 *         description: Parcel found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Parcel'
 *       404:
 *         description: Parcel not found
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
export const getParcelById = async (req: Request, res: Response) => {
  try {
    const deep = req.query.deep === "true";
    const parcel = deep
      ? await Parcel.findById(req.params.id)
          .populate("originRank destinationRank possibleRoute")
          .populate("package.type")
          .populate({
            path: "trip",
            populate: [
              "origin",
              "destination",
              { path: "route.driver" },
              { path: "route.association" },
              { path: "route.details", populate: ["fromRank", "toRank"] },
            ],
          })
      : await Parcel.findById(req.params.id)
          .populate("originRank destinationRank trip possibleRoute")
          .populate("package.type");
    if (!parcel) return res.status(404).json({ message: "Parcel not found" });
    res.status(200).json(parcel);
  } catch (error) {
    res.status(500).json({ message: "Error getting parcel", error });
  }
};

/**
 * @swagger
 * /api/parcel-details/{id}:
 *   put:
 *     summary: Update a Parcel
 *     description: Partially or fully updates a parcel.
 *     tags: [Parcels]
 *     operationId: updateParcel
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 *         description: Parcel ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateParcelRequest'
 *     responses:
 *       200:
 *         description: Parcel updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Parcel'
 *       404:
 *         description: Parcel not found
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
export const updateParcel = async (req: Request, res: Response) => {
  try {
    const deep = req.query.deep === "true";
    const updated = await Parcel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updated) return res.status(404).json({ message: "Parcel not found" });
    let parcel: any = updated;
    if (deep) {
      parcel = await Parcel.findById(updated._id)
        .populate("originRank destinationRank possibleRoute")
        .populate("package.type")
        .populate({
          path: "trip",
          populate: [
            "origin",
            "destination",
            { path: "route.driver" },
            { path: "route.association" },
            { path: "route.details", populate: ["fromRank", "toRank"] },
          ],
        });
    }
    res.status(200).json(parcel);
  } catch (error) {
    res.status(500).json({ message: "Error updating parcel", error });
  }
};

/**
 * @swagger
 * /api/parcel-details/{id}:
 *   delete:
 *     summary: Delete a Parcel
 *     description: Permanently removes a parcel.
 *     tags: [Parcels]
 *     operationId: deleteParcel
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 *         description: Parcel ID
 *     responses:
 *       200:
 *         description: Parcel deleted
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
 *         description: Parcel not found
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
export const deleteParcel = async (req: Request, res: Response) => {
  try {
    const deleted = await Parcel.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Parcel not found" });
    res.status(200).json({ message: "Parcel deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting parcel", error });
  }
};

/**
 * @swagger
 * /api/parcel-details/update-status:
 *   post:
 *     summary: Update Parcel Status
 *     description: Updates parcel status in lifecycle.
 *     tags: [Parcels]
 *     operationId: updateParcelStatus
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateParcelStatusRequest'
 *     responses:
 *       200:
 *         description: Status updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Parcel'
 *       404:
 *         description: Parcel not found
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
export const updateParcelStatus = async (req: Request, res: Response) => {
  try {
    const { parcelId, status } = req.body;
    const updated = await Parcel.findByIdAndUpdate(
      parcelId,
      { status },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Parcel not found" });
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: "Error updating parcel status", error });
  }
};

/**
 * @swagger
 * /api/parcel-details/verify-otp:
 *   post:
 *     summary: Verify Parcel Collection OTP
 *     description: Confirms parcel pickup by matching OTP then sets status to received.
 *     tags: [Parcels]
 *     operationId: verifyParcelOtp
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyParcelOtpRequest'
 *     responses:
 *       200:
 *         description: OTP verified
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Parcel'
 *       400:
 *         description: Invalid OTP
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Parcel not found
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
export const verifyParcelOtp = async (req: Request, res: Response) => {
  try {
    const { parcelId, otp } = req.body;
    const parcel = await Parcel.findById(parcelId);
    if (!parcel) return res.status(404).json({ message: "Parcel not found" });
    if (parcel.receiverOtp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    parcel.status = "received";
    await parcel.save();
    res.status(200).json(parcel);
  } catch (error) {
    res.status(500).json({ message: "Error verifying OTP", error });
  }
};
