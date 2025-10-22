import mongoose, { Schema, Document } from "mongoose";

export interface IPackageType extends Document {
  sku: string;
  name: string;
  price: number; // price in local currency
  createdAt: Date;
  updatedAt: Date;
}

const PackageTypeSchema: Schema<IPackageType> = new Schema(
  {
    sku: { type: String, required: true, trim: true, unique: true },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<IPackageType>("PackageType", PackageTypeSchema);
