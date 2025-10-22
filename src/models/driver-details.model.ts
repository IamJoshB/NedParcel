import mongoose from "mongoose";

const driversSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    linkedRanks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TaxiRank", 
      },
    ],
    bankingDetails: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BankingDetails", 
    },
    taxiAssociation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TaxiAssociation", 
    },
    // File asset paths
    idDocumentPath: { type: String, trim: true }, // PDF of driver ID
    operatingPermitPath: { type: String, trim: true }, // PDF operating permit
    licenseDiskPath: { type: String, trim: true }, // PDF license disk
    photoPath: { type: String, trim: true }, // Image of the driver
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Driver", driversSchema);
