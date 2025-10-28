import mongoose, { Schema, Document } from "mongoose";

export type ParcelStatus =
  | "awaiting-pickup"
  | "in-transit"
  | "delivered"
  | "received";

export interface IParcel extends Document {
  trackingNumber: string;
  senderIdNumber: string; // ID or Passport
  senderFirstName: string;
  senderLastName: string;
  senderPhone: string;
  receiverPhone: string;
  receiverOtp: string; // stored hashed ideally (plain for now)
  package: Package;
  trip: mongoose.Types.ObjectId; // Trip reference
  legIndex: number; // which leg of the trip
  status: ParcelStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Package {
  identifier: string;
  type: mongoose.Types.ObjectId;
}

const ParcelSchema = new Schema<IParcel>(
  {
    trackingNumber: { type: String, required: true, unique: true, index: true },
    senderIdNumber: { type: String, required: true, trim: true },
    senderFirstName: { type: String, required: true, trim: true },
    senderLastName: { type: String, required: true, trim: true },
    senderPhone: { type: String, required: true, trim: true },
    receiverPhone: { type: String, required: true, trim: true },
    receiverOtp: { type: String, required: true },
    package: {
      identifier: { type: String, required: true, unique: true, index: true },
      type: {
        type: Schema.Types.ObjectId,
        ref: "PackageType",
        required: true,
      },
    },
    trip: { type: Schema.Types.ObjectId, ref: "Trip" },
    legIndex: { type: Number, min: 0 },
    status: {
      type: String,
      enum: ["awaiting-pickup", "in-transit", "delivered", "received"],
      default: "awaiting-pickup",
      index: true,
    },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model<IParcel>("Parcel", ParcelSchema);
