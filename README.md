# NedParcel API

## Overview
NedParcel is an Express + TypeScript + Mongoose REST API for managing taxi transport domain entities (Taxi Ranks, Possible Routes, Trips, Drivers, Marshalls, Associations, Banking Details, Parcels, Package Types) including multi-leg trips and parcel routing.

## Key Domain Concepts
- TaxiRank: Physical rank. Linked to other ranks via PossibleRoute documents (bidirectional routes supported).
- PossibleRoute: Represents travel between two ranks (fromRank -> toRank). Reverse routes are automatically created for symmetry.
- TaxiAssociation: Organisation that can be linked to ranks and drivers/marshalls. Populates optional BankingDetails.
- Driver: Can link multiple ranks, an association, and banking details. Handles document/image uploads.
- Marshall: Linked to a single rank and optional association.
- Trip: Multi-leg journey with originRank, destinationRank, fullDistance, and an array of route legs. Each leg links a driver and a PossibleRoute.
- Parcel: Shipped item that embeds a package (type + identifier) and can optionally attach to a specific trip leg (trip + legIndex + possibleRoute).
- PackageType: Lookup entity for parcel package types.

## Population Depth Strategy
To balance payload size vs relational completeness, several endpoints accept query parameters to control depth:

### Query Parameters
- `?deep=true` (Trips & Parcels): Returns full nested population.
  - Trips deep mode populates: originRank, destinationRank, route.driver, route.association, route.details (with fromRank, toRank).
  - Parcels deep mode populates: originRank, destinationRank, possibleRoute (with fromRank, toRank), package.type, and trip with full deep trip population (including nested route legs).
- `?shallow=true` (Taxi Ranks): Returns reduced population.
  - Shallow: `possibleRoutes` (no nested rank documents) + `taxiAssociations` (without bankingDetails).
  - Deep (default): `possibleRoutes` with fromRank & toRank, and `taxiAssociations` with their bankingDetails.

If neither parameter is supplied for the respective resource, the default is:
- Trips: Shallow (omit association + origin/destination deep nesting).
- Parcels: Shallow.
- Taxi Ranks: Deep.

## Filtering Values Endpoints
Lightweight endpoints provide minimal projection (id + display fields) for dropdowns and seeding orchestration. These improve performance and reduce over-fetching during initial linking operations.

Examples (paths illustrative):
- `GET /api/taxi-ranks/filtering-values`
- `GET /api/taxi-associations/filtering-values`
- `GET /api/possible-routes/filtering-values`
- `GET /api/drivers/filtering-values`
- `GET /api/package-types/filtering-values`

## Seeding Journeys
Data seeding is performed via an HTTP journey script rather than direct database inserts to exercise real business logic:
1. Create base ranks & associations + banking details.
2. Create symmetric possible routes between ranks.
3. Create drivers and marshalls; link ranks/associations and banking.
4. Create trips with multi-leg routes and link drivers & routes per leg.
5. Create parcels with embedded package info; optionally link to a trip leg.
6. Fetch filtering-values for subsequent linking steps.

## Linking Patterns
- Rank <-> Rank: `POST /api/taxi-ranks/:id/destinations` creates a PossibleRoute (and its reverse).
- Trip leg linking: `PUT /api/trips/:tripId/legs/:legIndex/link` to attach driver + route.
- Parcel to trip leg: `PUT /api/parcels/:id/link-trip-leg` with `{ tripId, legIndex }`.
- Driver link operations: rank, bankingDetails, association endpoints all return fully populated driver.

## Example Deep Fetch
```
GET /api/trips?deep=true
```
Response includes nested driver, association, and route.rank details for each leg.

## File Uploads
Driver creation/update supports memory-based uploads (Multer) for documents/photos. Validate sizes & mime types client-side.

## Error Handling
Consistent JSON structure:
```
{ "message": "Human readable", "error": <optional raw error> }
```

## Extensibility Notes / Next Steps
- Caching strategy for deep trip/parcel fetches (e.g., Redis layer or selective field projection) can be added.
- Pagination & projection parameters for high-volume collections.
- Add rate limiting for upload endpoints.

## Running
Install dependencies and start the server:
```bash
npm install
npm run dev
```

## Environment Variables (sample)
```
MONGO_URI=mongodb://localhost:27017/nedparcel
PORT=3000
```

## License
Proprietary / Internal Use Only
