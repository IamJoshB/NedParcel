import express from "express";
import connectDB from "./config/db";
import cors, { CorsOptions } from "cors";

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
const ALLOWED_ORIGINS = (process.env.CORS_ALLOWED_ORIGINS || "*")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const app = express();

connectDB();
app.use(express.json());
// CORS configuration: allow all by default, or restrict via CORS_ALLOWED_ORIGINS env (comma-separated list)
const corsOptions: CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) return callback(null, true); // allow non-browser or same-origin
    if (ALLOWED_ORIGINS.includes("*") || ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("CORS: Origin not allowed"));
  },
  credentials: true,
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
};
app.use(cors(corsOptions));

// Explicit preflight handling (optional redundancy for some proxies)
app.options("*", cors());
app.use("/api/possible-routes", possibleRoutes);

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
