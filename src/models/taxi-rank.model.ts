import mongoose from "mongoose";

const taxiRanksSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    address: {
      streetNo: { type: String, required: true, trim: true },
      streetName: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
      province: { type: String, required: true, trim: true },
      suburb: { type: String, required: true, trim: true },
      postalCode: { type: String, required: true, trim: true },
    },
    possibleRoutes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PossibleRoute", 
      },
    ],
    taxiAssociations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TaxiAssociation", 
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("TaxiRank", taxiRanksSchema);