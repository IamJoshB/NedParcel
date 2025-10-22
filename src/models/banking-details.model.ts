import mongoose from "mongoose";

const bankingDetailsSchema = new mongoose.Schema(
  {
    accountHolder: { type: String, required: true, trim: true },
    bankName: { type: String, required: true, trim: true },
    accountNumber: { type: String, required: true, trim: true },
    branchCode: { type: String, required: true, trim: true },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

export default mongoose.model("BankingDetails", bankingDetailsSchema);
