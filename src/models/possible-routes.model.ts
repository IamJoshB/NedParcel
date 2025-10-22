import mongoose from "mongoose";

const routesSchema = new mongoose.Schema(
  {
    farePrice: { type: Number, required: true },
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
