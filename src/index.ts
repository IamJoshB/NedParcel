import express from "express";
import connectDB from "./config/db";

import bankingDetailsRoutes from "./routes/banking-details.routes";
import driverDetailsRoutes from "./routes/driver-details.routes";
import marshallRoutes from "./routes/marshall-details.routes";
import possibleRoutes from "./routes/possible-routes.routes";

import taxiAssociationRoutes from "./routes/taxi-association.routes";
import taxiRankRoutes from "./routes/taxi-rank-routes";
import tripDetailsRoutes from "./routes/trip-details.routes";
import packageTypesRoutes from "./routes/package-types.routes";
import parcelDetailsRoutes from "./routes/parcel-details.routes";
import swaggerDocs from "./swagger/swagger";

const PORT = 3000;
const app = express();

connectDB();
app.use(express.json());
app.use("/api/routes", possibleRoutes);

app.use("/api/banking-details", bankingDetailsRoutes);
app.use("/api/driver-details", driverDetailsRoutes);
app.use("/api/marshall-details", marshallRoutes);
app.use("/api/trip-details", tripDetailsRoutes);

app.use("/api/taxi-ranks", taxiRankRoutes);
app.use("/api/taxi-associations", taxiAssociationRoutes);
app.use("/api/package-types", packageTypesRoutes);
app.use("/api/parcel-details", parcelDetailsRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  swaggerDocs(app);
});
