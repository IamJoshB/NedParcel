import mongoose from "mongoose";

const taxiAssociationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    password: { type: String, required: true }, // Consider hashing before saving
    contactPerson: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address: {
      streetNo: { type: String, required: true, trim: true },
      streetName: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
      province: { type: String, required: true, trim: true },
      suburb: { type: String, required: true, trim: true },
      postalCode: { type: String, required: true, trim: true },
    },
    bankingDetails: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BankingDetails", 
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("TaxiAssociation", taxiAssociationSchema);
