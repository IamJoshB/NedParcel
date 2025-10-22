import mongoose from "mongoose";

const marshallSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    status: { type: String, required: true, trim: true },
    linkedRank: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TaxiRank", 
    },
    taxiAssociation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TaxiAssociation", 
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Marshall", marshallSchema);
