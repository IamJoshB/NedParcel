import mongoose from "mongoose";

const routesSchema = new mongoose.Schema(
  {
    farePrice: { type: Number, required: true },
    price: { type: Number, required: true }, // package movement price between the two ranks
    driverSplit: { type: Number, required: true, default: 0 },
    associationSplit: { type: Number, required: true, default: 0 },
    distance: { type: Number, required: true },
    fromRank: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TaxiRank",
      required: true,
    },
    toRank: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TaxiRank",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("PossibleRoute", routesSchema);
