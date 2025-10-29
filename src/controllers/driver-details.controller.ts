import { Request, Response } from "express";
import Driver from "../models/driver-details.model";
import path from "path";
import fs from "fs";

/**
 * @swagger
 * tags:
 *   - name: Drivers
 *     description: Operations for creating, reading and managing drivers and their relations.
 * components:
 *   schemas:
 *     ObjectId:
 *       type: string
 *       description: MongoDB ObjectId
 *       example: 650f0f3c2a5e4d001234abcd
 *     Driver:
 *       type: object
 *       description: A registered taxi driver.
 *       properties:
 *         _id:
 *           $ref: '#/components/schemas/ObjectId'
 *         firstName:
 *           type: string
 *           example: John
 *         lastName:
 *           type: string
 *           example: Doe
 *         phone:
 *           type: string
 *           example: "+27111234567"
 *         linkedRanks:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ObjectId'
 *         bankingDetails:
 *           $ref: '#/components/schemas/ObjectId'
 *         taxiAssociation:
 *           $ref: '#/components/schemas/ObjectId'
 *         idDocumentPath:
 *           type: string
 *           description: Relative path to uploaded ID document PDF
 *           example: uploads/drivers/650f0f3c2a5e4d001234abcd-id.pdf
 *         operatingPermitPath:
 *           type: string
 *           description: Relative path to uploaded operating permit PDF
 *           example: uploads/drivers/650f0f3c2a5e4d001234abcd-permit.pdf
 *         licenseDiskPath:
 *           type: string
 *           description: Relative path to uploaded license disk PDF
 *           example: uploads/drivers/650f0f3c2a5e4d001234abcd-license.pdf
 *         photoPath:
 *           type: string
 *           description: Relative path to uploaded driver image
 *           example: uploads/drivers/650f0f3c2a5e4d001234abcd-photo.jpg
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
 *     CreateDriverRequest:
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
 *     UpdateDriverRequest:
 *       type: object
 *       description: Any subset of Driver fields to update.
 *       properties:
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         phone:
 *           type: string
 *         linkedRanks:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ObjectId'
 *         bankingDetails:
 *           $ref: '#/components/schemas/ObjectId'
 *         taxiAssociation:
 *           $ref: '#/components/schemas/ObjectId'
 *     LinkRankRequest:
 *       type: object
 *       properties:
 *         driverId:
 *           $ref: '#/components/schemas/ObjectId'
 *         rankId:
 *           $ref: '#/components/schemas/ObjectId'
 *       required:
 *         - driverId
 *         - rankId
 *     LinkBankingRequest:
 *       type: object
 *       properties:
 *         driverId:
 *           $ref: '#/components/schemas/ObjectId'
 *         bankingDetailsId:
 *           $ref: '#/components/schemas/ObjectId'
 *       required:
 *         - driverId
 *         - bankingDetailsId
 *     LinkAssociationRequest:
 *       type: object
 *       properties:
 *         driverId:
 *           $ref: '#/components/schemas/ObjectId'
 *         taxiAssociationId:
 *           $ref: '#/components/schemas/ObjectId'
 *       required:
 *         - driverId
 *         - taxiAssociationId
 *     UnlinkRankRequest:
 *       type: object
 *       properties:
 *         driverId:
 *           $ref: '#/components/schemas/ObjectId'
 *         rankId:
 *           $ref: '#/components/schemas/ObjectId'
 *       required:
 *         - driverId
 *         - rankId
 *     UnlinkBankingRequest:
 *       type: object
 *       properties:
 *         driverId:
 *           $ref: '#/components/schemas/ObjectId'
 *       required:
 *         - driverId
 *     UnlinkAssociationRequest:
 *       type: object
 *       properties:
 *         driverId:
 *           $ref: '#/components/schemas/ObjectId'
 *       required:
 *         - driverId
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
 * /api/driver-details:
 *   post:
 *     summary: Create a new driver
 *     description: Registers a new driver in the system.
 *     tags: [Drivers]
 *     operationId: createDriver
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateDriverRequest'
 *           examples:
 *             sample:
 *               value:
 *                 firstName: John
 *                 lastName: Doe
 *                 phone: "+27111234567"
 *     responses:
 *       201:
 *         description: Driver created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Driver'
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
export const createDriver = async (req: Request, res: Response) => {
  try {
    const driver = new Driver(req.body);
    await driver.save();
    const populated = await Driver.findById(driver._id)
      .populate("linkedRanks")
      .populate("bankingDetails")
      .populate("taxiAssociation");
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: "Error creating driver", error });
  }
};

/**
 * @swagger
 * /api/driver-details:
 *   get:
 *     summary: Get all drivers
 *     description: Returns a list of all drivers. Use ?shallow=true to omit population of linkedRanks, bankingDetails and taxiAssociation.
 *     tags: [Drivers]
 *     operationId: getAllDrivers
 *     parameters:
 *       - in: query
 *         name: shallow
 *         schema:
 *           type: boolean
 *         description: If true, returns raw document without populated relationship references.
 *     responses:
 *       200:
 *         description: List of drivers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Driver'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const getAllDrivers = async (_req: Request, res: Response) => {
  try {
    const drivers = await Driver.find()
      .populate("linkedRanks")
      .populate("bankingDetails")
      .populate("taxiAssociation");
    res.status(200).json(drivers);
  } catch (error) {
    res.status(500).json({ message: "Error getting drivers", error });
  }
};

/**
 * @swagger
 * /api/driver-details/{id}:
 *   get:
 *     summary: Get a driver by ID
 *     description: Retrieves a single driver. Use ?shallow=true to omit population of linkedRanks, bankingDetails and taxiAssociation.
 *     tags: [Drivers]
 *     operationId: getDriverById
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 *         description: Driver ID
 *       - in: query
 *         name: shallow
 *         schema:
 *           type: boolean
 *         description: If true, returns driver without populated relationship documents.
 *     responses:
 *       200:
 *         description: Driver details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Driver'
 *       404:
 *         description: Driver not found
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
export const getDriverById = async (req: Request, res: Response) => {
  try {
    const driver = await Driver.findById(req.params.id)
      .populate("linkedRanks")
      .populate("bankingDetails")
      .populate("taxiAssociation");

    if (!driver) return res.status(404).json({ message: "Driver not found" });

    res.status(200).json(driver);
  } catch (error) {
    res.status(500).json({ message: "Error getting driver details", error });
  }
};

/**
 * @swagger
 * /api/driver-details/{id}:
 *   put:
 *     summary: Update a driver
 *     description: Updates some or all fields of a driver. Use ?shallow=true to omit population of linkedRanks, bankingDetails and taxiAssociation in response.
 *     tags: [Drivers]
 *     operationId: updateDriver
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 *         description: Driver ID
 *       - in: query
 *         name: shallow
 *         schema:
 *           type: boolean
 *         description: If true, returns driver without populated relationship documents.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateDriverRequest'
 *     responses:
 *       200:
 *         description: Driver updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Driver'
 *       404:
 *         description: Driver not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
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
export const updateDriver = async (req: Request, res: Response) => {
  try {
    const driver = await Driver.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!driver) return res.status(404).json({ message: "Driver not found" });

    const populated = await Driver.findById(driver._id)
      .populate("linkedRanks")
      .populate("bankingDetails")
      .populate("taxiAssociation");
    res.status(200).json(populated);
  } catch (error) {
    res.status(500).json({ message: "Error updating driver details", error });
  }
};

/**
 * @swagger
 * /api/driver-details/{id}:
 *   delete:
 *     summary: Delete a driver
 *     description: Permanently removes a driver.
 *     tags: [Drivers]
 *     operationId: deleteDriver
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 *         description: Driver ID
 *       - in: query
 *         name: shallow
 *         schema:
 *           type: boolean
 *         description: If true, skips population (useful for lightweight confirmation).
 *     responses:
 *       200:
 *         description: Driver deleted successfully
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
 *         description: Driver not found
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
export const deleteDriver = async (req: Request, res: Response) => {
  try {
    const driver = await Driver.findByIdAndDelete(req.params.id);
    if (!driver) return res.status(404).json({ message: "Driver not found" });

    res.status(200).json({ message: "Driver deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting driver", error });
  }
};

/**
 * @swagger
 * /api/driver-details/link-rank:
 *   post:
 *     summary: Link a TaxiRank to a driver
 *     description: Adds a taxi rank to driver's linkedRanks. Use ?shallow=true to omit population in response.
 *     tags: [Drivers]
 *     operationId: linkTaxiRank
 *     parameters:
 *       - in: query
 *         name: shallow
 *         schema:
 *           type: boolean
 *         description: If true, returns driver without populated relationships.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LinkRankRequest'
 *     responses:
 *       200:
 *         description: TaxiRank linked successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Driver'
 *       404:
 *         description: Driver not found
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
    const { driverId, rankId } = req.body;

    const driver = await Driver.findById(driverId);
    if (!driver) return res.status(404).json({ message: "Driver not found" });

    if (!driver.linkedRanks.includes(rankId)) {
      driver.linkedRanks.push(rankId);
      await driver.save();
    }
    const populated = await Driver.findById(driver._id)
      .populate("linkedRanks")
      .populate("bankingDetails")
      .populate("taxiAssociation");
    res.status(200).json(populated);
  } catch (error) {
    res.status(500).json({ message: "Error linking taxi details", error });
  }
};

/**
 * @swagger
 * /api/driver-details/link-banking:
 *   post:
 *     summary: Link BankingDetails to a driver
 *     description: Assigns banking details record to driver. Use ?shallow=true to omit population in response.
 *     tags: [Drivers]
 *     operationId: linkBankingDetails
 *     parameters:
 *       - in: query
 *         name: shallow
 *         schema:
 *           type: boolean
 *         description: If true, returns driver without populated relationships.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LinkBankingRequest'
 *     responses:
 *       200:
 *         description: BankingDetails linked successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Driver'
 *       404:
 *         description: Driver not found
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
    const { driverId, bankingDetailsId } = req.body;

    const driver = await Driver.findByIdAndUpdate(
      driverId,
      { bankingDetails: bankingDetailsId },
      { new: true }
    );

    if (!driver) return res.status(404).json({ message: "Driver not found" });

    const populated = await Driver.findById(driver._id)
      .populate("linkedRanks")
      .populate("bankingDetails")
      .populate("taxiAssociation");
    res.status(200).json(populated);
  } catch (error) {
    res.status(500).json({ message: "Error linking banking details", error });
  }
};

/**
 * @swagger
 * /api/driver-details/link-association:
 *   post:
 *     summary: Link TaxiAssociation to a driver
 *     description: Assigns taxi association record to driver. Use ?shallow=true to omit population in response.
 *     tags: [Drivers]
 *     operationId: linkTaxiAssociation
 *     parameters:
 *       - in: query
 *         name: shallow
 *         schema:
 *           type: boolean
 *         description: If true, returns driver without populated relationships.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LinkAssociationRequest'
 *     responses:
 *       200:
 *         description: TaxiAssociation linked successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Driver'
 *       404:
 *         description: Driver not found
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
    const { driverId, taxiAssociationId } = req.body;

    const driver = await Driver.findByIdAndUpdate(
      driverId,
      { taxiAssociation: taxiAssociationId },
      { new: true }
    );

    if (!driver) return res.status(404).json({ message: "Driver not found" });

    const populated = await Driver.findById(driver._id)
      .populate("linkedRanks")
      .populate("bankingDetails")
      .populate("taxiAssociation");
    res.status(200).json(populated);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error linking association details", error });
  }
};

/**
 * @swagger
 * /api/driver-details/unlink-rank:
 *   post:
 *     summary: Unlink a TaxiRank from a driver
 *     description: Removes a taxi rank from driver's linkedRanks. Use ?shallow=true to omit population in response.
 *     tags: [Drivers]
 *     operationId: unlinkTaxiRank
 *     parameters:
 *       - in: query
 *         name: shallow
 *         schema:
 *           type: boolean
 *         description: If true, returns driver without populated relationships.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UnlinkRankRequest'
 *     responses:
 *       200:
 *         description: TaxiRank unlinked successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Driver'
 *       404:
 *         description: Driver not found
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
    const { driverId, rankId } = req.body;

    const driver = await Driver.findById(driverId);
    if (!driver) return res.status(404).json({ message: "Driver not found" });

    driver.linkedRanks = driver.linkedRanks.filter(
      (id) => id.toString() !== rankId
    );

    await driver.save();
    const populated = await Driver.findById(driver._id)
      .populate("linkedRanks")
      .populate("bankingDetails")
      .populate("taxiAssociation");
    res.status(200).json(populated);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error unlinking taxi rank details", error });
  }
};

/**
 * @swagger
 * /api/driver-details/unlink-banking:
 *   post:
 *     summary: Unlink BankingDetails from a driver
 *     description: Unsets driver's bankingDetails reference. Use ?shallow=true to omit population in response.
 *     tags: [Drivers]
 *     operationId: unlinkBankingDetails
 *     parameters:
 *       - in: query
 *         name: shallow
 *         schema:
 *           type: boolean
 *         description: If true, returns driver without populated relationships.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UnlinkBankingRequest'
 *     responses:
 *       200:
 *         description: BankingDetails unlinked successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Driver'
 *       404:
 *         description: Driver not found
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
    const { driverId } = req.body;

    const driver = await Driver.findByIdAndUpdate(
      driverId,
      { $unset: { bankingDetails: "" } },
      { new: true }
    );

    if (!driver) return res.status(404).json({ message: "Driver not found" });

    const populated = await Driver.findById(driver._id)
      .populate("linkedRanks")
      .populate("bankingDetails")
      .populate("taxiAssociation");
    res.status(200).json(populated);
  } catch (error) {
    res.status(500).json({ message: "Error unlinking banking details", error });
  }
};

/**
 * @swagger
 * /api/driver-details/unlink-association:
 *   post:
 *     summary: Unlink TaxiAssociation from a driver
 *     description: Unsets driver's taxiAssociation reference. Use ?shallow=true to omit population in response.
 *     tags: [Drivers]
 *     operationId: unlinkTaxiAssociation
 *     parameters:
 *       - in: query
 *         name: shallow
 *         schema:
 *           type: boolean
 *         description: If true, returns driver without populated relationships.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UnlinkAssociationRequest'
 *     responses:
 *       200:
 *         description: TaxiAssociation unlinked successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Driver'
 *       404:
 *         description: Driver not found
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
    const { driverId } = req.body;

    const driver = await Driver.findByIdAndUpdate(
      driverId,
      { $unset: { taxiAssociation: "" } },
      { new: true }
    );

    if (!driver) return res.status(404).json({ message: "Driver not found" });

    const populated = await Driver.findById(driver._id)
      .populate("linkedRanks")
      .populate("bankingDetails")
      .populate("taxiAssociation");
    res.status(200).json(populated);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error unlinking association details", error });
  }
};

/**
 * @swagger
 * /api/driver-details/{id}/upload/id-document:
 *   post:
 *     summary: Upload Driver ID Document (PDF)
 *     tags: [Drivers]
 *     operationId: uploadDriverIdDocument
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *           encoding:
 *             file:
 *               contentType: application/pdf
 *     responses:
 *       200:
 *         description: ID document uploaded successfully
 *       400:
 *         description: Validation / file error
 *       404:
 *         description: Driver not found
 *       500:
 *         description: Server error
 */
export const uploadDriverIdDocument = async (req: Request, res: Response) => {
  await handleSingleUpload(
    req,
    res,
    "idDocumentPath",
    "id",
    /^application\/pdf$/
  );
};

/**
 * @swagger
 * /api/driver-details/{id}/upload/operating-permit:
 *   post:
 *     summary: Upload Driver Operating Permit (PDF)
 *     tags: [Drivers]
 *     operationId: uploadDriverOperatingPermit
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *           encoding:
 *             file:
 *               contentType: application/pdf
 *     responses:
 *       200:
 *         description: Operating permit uploaded successfully
 *       400:
 *         description: Validation / file error
 *       404:
 *         description: Driver not found
 *       500:
 *         description: Server error
 */
export const uploadDriverOperatingPermit = async (
  req: Request,
  res: Response
) => {
  await handleSingleUpload(
    req,
    res,
    "operatingPermitPath",
    "permit",
    /^application\/pdf$/
  );
};

/**
 * @swagger
 * /api/driver-details/{id}/upload/license-disk:
 *   post:
 *     summary: Upload Driver License Disk (PDF)
 *     tags: [Drivers]
 *     operationId: uploadDriverLicenseDisk
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *           encoding:
 *             file:
 *               contentType: application/pdf
 *     responses:
 *       200:
 *         description: License disk uploaded successfully
 *       400:
 *         description: Validation / file error
 *       404:
 *         description: Driver not found
 *       500:
 *         description: Server error
 */
export const uploadDriverLicenseDisk = async (req: Request, res: Response) => {
  await handleSingleUpload(
    req,
    res,
    "licenseDiskPath",
    "license",
    /^application\/pdf$/
  );
};

/**
 * @swagger
 * /api/driver-details/{id}/upload/photo:
 *   post:
 *     summary: Upload Driver Photo (image)
 *     tags: [Drivers]
 *     operationId: uploadDriverPhoto
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *           encoding:
 *             file:
 *               contentType: image/jpeg, image/png
 *     responses:
 *       200:
 *         description: Photo uploaded successfully
 *       400:
 *         description: Validation / file error
 *       404:
 *         description: Driver not found
 *       500:
 *         description: Server error
 */
export const uploadDriverPhoto = async (req: Request, res: Response) => {
  await handleSingleUpload(
    req,
    res,
    "photoPath",
    "photo",
    /^(image\/(jpeg|png))$/
  );
};

// Ensure uploads directory exists
const uploadsDir = path.resolve(process.cwd(), "uploads", "drivers");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ---- File Upload Helpers ----
// No need to redeclare Express.Request.file; use Express.Multer.File type from @types/multer

const writeBufferToFile = (
  driverId: string,
  suffix: string,
  originalName: string,
  buffer: Buffer
) => {
  const ext = path.extname(originalName) || ".pdf";
  const fileName = `${driverId}-${suffix}${ext}`;
  const filePath = path.join(uploadsDir, fileName);
  fs.writeFileSync(filePath, buffer);
  return path.relative(process.cwd(), filePath).replace(/\\/g, "/");
};

// Common handler generator
const handleSingleUpload = async (
  req: Request,
  res: Response,
  field:
    | "idDocumentPath"
    | "operatingPermitPath"
    | "licenseDiskPath"
    | "photoPath",
  suffix: string,
  allowedMime: RegExp
) => {
  try {
    const driverId = req.params.id;
    if (!req.file) {
      return res.status(400).json({ message: "File is required" });
    }
    if (!allowedMime.test(req.file.mimetype)) {
      return res.status(400).json({ message: "Invalid file type" });
    }
    const driver = await Driver.findById(driverId);
    if (!driver) return res.status(404).json({ message: "Driver not found" });
    const storedPath = writeBufferToFile(
      driverId,
      suffix,
      req.file.originalname,
      req.file.buffer
    );
    (driver as any)[field] = storedPath;
    await driver.save();
    res.status(200).json({ message: "File uploaded", field, path: storedPath });
  } catch (error) {
    res.status(500).json({ message: "Error uploading file", error });
  }
};

/**
 * @swagger
 * /api/driver-details/filtering-values:
 *   get:
 *     summary: Get filtering values for Drivers
 *     description: Returns id + full name for each driver.
 *     tags: [Drivers]
 *     operationId: getDriverFilteringValues
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
export const getDriverFilteringValues = async (_req: Request, res: Response) => {
  try {
    const docs = await Driver.find({}, "firstName lastName");
    res.status(200).json(docs.map((d) => ({ id: d._id, name: `${d.firstName} ${d.lastName}`.trim() })));
  } catch (error) {
    res.status(500).json({ message: "Error getting filtering values", error });
  }
};
