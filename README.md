# NedParcel API

## Overview
NedParcel is an Express + TypeScript + Mongoose REST API for managing taxi transport domain entities (Taxi Ranks, Possible Routes, Trips, Drivers, Marshalls, Associations, Banking Details, Parcels, Package Types). It supports multi-leg trips, automatic shortest-route generation, flexible parcel leg movement, and depth-controlled population.

## Key Domain Concepts
- TaxiRank: Physical rank. Linked to other ranks via `PossibleRoute` documents (directed edges). A reverse route is automatically created for symmetry after each forward route creation.
- PossibleRoute: Represents travel between two ranks (`fromRank` -> `toRank`) with distance & fare pricing (used to aggregate trip distance and pricing logic).
- TaxiAssociation: Organisation that can be linked to ranks and drivers/marshalls. Optionally populates `BankingDetails`.
- Driver: Can link multiple ranks, an association, and banking details. Supports document/image uploads (memory storage; implement persistence later).
- Marshall: Linked to a single rank and optional association.
- Trip: A multi-leg journey with `origin` and `destination` rank references, computed `fullDistance` (sum of leg route distances), and a `route` array of legs. Each leg links a driver (`driver`) and a possible route (`details`). During creation/update, legs can be supplied using helper properties `driverId` and `routeId` which are mapped internally.
- Parcel: Shipped item that embeds a `package` (with `type` reference) and can optionally attach to a specific trip leg (`trip` + `legIndex`). Parcel no longer stores `originRank`, `destinationRank`, `possibleRoute`, or `price` fields—these are derived or inferred from its linked Trip legs. Movement across legs (and optionally across trips) is supported.
- PackageType: Lookup entity defining allowed package classifications. Used inside parcel.package.type.

## Trip Route Auto-Generation (Shortest Hop)
If you provide `origin` and `destination` for a new Trip but omit the `route` array, the system performs a breadth-first search (BFS) across `PossibleRoute` edges to build the shortest-hop path. Each discovered hop becomes a leg; leg numbering starts at `1` and increments. You may still explicitly pass a `route` array if you need precise driver/route assignments or a non-shortest path.

### Leg Input Mapping & Defaults
- In `CreateTripRequest` and leg replacement during `UpdateTripRequest`, you can supply `driverId` and `routeId` per leg; these are internally assigned to `driver` and `details`.
- If a leg number (`leg`) is omitted in input it defaults to `1` (legacy support); subsequent normalization ensures sequential leg ordering.
- `fullDistance` is server-calculated; clients should NOT send it.

## Parcel Movement & Tracking
- Parcels can be re-assigned to a different leg (and optionally a different trip) via `POST /api/parcel-details/move-leg` with `{ parcelId, legIndex, tripId? }`.
- `trackingNumber` and any receiver verification OTP are generated server-side during parcel creation.
- Removing legacy fields simplified parcel state; route context is always derived from the linked trip + leg index.

## Population Depth Strategy
To balance payload size vs relational completeness, several endpoints accept query parameters to control depth:

## Population Depth Strategy
To balance payload size vs relational completeness, several endpoints accept query parameters to control depth:

### Query Parameters
- `?deep=true` (Trips & Parcels): Returns full nested population.
  - Trips deep mode populates: originRank, destinationRank, route.driver, route.association, route.details (with fromRank, toRank).
  - Parcels deep mode populates: package.type and trip with full deep trip population (including nested route legs). Origin/destination and route info are inferred from trip legs.
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
Seeding uses real HTTP endpoints (not direct DB writes) to exercise validations & population. Typical journey order:
1. Create base ranks & associations + banking details.
2. Create symmetric possible routes between ranks (reverse automatically generated).
3. Create drivers and marshalls; link ranks/associations and banking.
4. (Optional) Fetch filtering values to drive UI/link decisions.
5. Create trips: either provide explicit `route` legs or rely on BFS auto-generation with `origin` + `destination` only.
6. Link drivers/routes per leg if not supplied or need adjustment.
7. Create parcels with embedded package info; optionally link to a trip leg immediately.
8. Move parcels between trip legs as operational changes occur.

## Linking Patterns
- Rank <-> Rank: `POST /api/taxi-ranks/:id/destinations` creates a PossibleRoute (and its reverse).
- Trip leg linking (legacy / may be deprecated): `PUT /api/trips/:tripId/legs/:legIndex/link` to attach driver + route if not using direct leg creation mapping.
- Parcel to trip leg (legacy direct link): `PUT /api/parcels/:id/link-trip-leg` with `{ tripId, legIndex }`.
- Parcel move between legs (preferred operational update): `POST /api/parcel-details/move-leg` with `{ parcelId, legIndex, tripId? }`.
- Driver link operations: rank, bankingDetails, association endpoints all return fully populated driver.

### Trip Leg Defaults Recap
If a leg number isn't supplied for a route entry it defaults to `1`; legs are then normalized sequentially. Provide explicit numbers for clarity when multiple legs are sent.

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
- Swagger alignment: ensure Trip `route` becomes optional when auto-generation is used (current implementation supports omission with origin/destination).
- Deprecate legacy link/unlink endpoints once direct leg mapping is fully adopted.
- Caching strategy for deep trip/parcel fetches (Redis or selective projections).
- Pagination & projection parameters for high-volume collections.
- Rate limiting for upload endpoints.

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
