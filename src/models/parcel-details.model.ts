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
  originRank: mongoose.Types.ObjectId;
  destinationRank: mongoose.Types.ObjectId;
  package: Package;
  trip: mongoose.Types.ObjectId; // Trip reference
  legIndex: number; // which leg of the trip
  possibleRoute: mongoose.Types.ObjectId; // specific PossibleRoute used
  status: ParcelStatus;
  price: number; // final price charged
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
    originRank: {
      type: Schema.Types.ObjectId,
      ref: "TaxiRank",
      required: true,
    },
    destinationRank: {
      type: Schema.Types.ObjectId,
      ref: "TaxiRank",
      required: true,
    },
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
    possibleRoute: { type: Schema.Types.ObjectId, ref: "PossibleRoute" },
    status: {
      type: String,
      enum: ["awaiting-pickup", "in-transit", "delivered", "received"],
      default: "awaiting-pickup",
      index: true,
    },
    price: { type: Number, required: true, min: 0 },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model<IParcel>("Parcel", ParcelSchema);
