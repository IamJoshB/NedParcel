import mongoose from "mongoose";

const tripsSchema = new mongoose.Schema(
  {
    price: { type: Number, required: true },
    fullDistance: { type: Number, required: true },
    origin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TaxiRank",
      required: true,
    },
    destination: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TaxiRank",
      required: true,
    },
    route: [
      {
        leg: { type: Number, required: true },
        association: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "TaxiAssociation",
        },
        associationSplit: { type: Number, required: true },
        driver: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Driver",
        },
        driverSplit: { type: Number, required: true },
        details: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "PossibleRoute",
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Trip", tripsSchema);
