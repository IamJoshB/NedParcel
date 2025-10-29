# NedParcel API

## 1. Overview
NedParcel is an Express + TypeScript + Mongoose REST API for the taxi transport domain: Taxi Ranks, Directed Possible Routes, Trips (auto-generated multi-leg paths), Drivers, Marshalls, Taxi Associations, Banking Details, Parcels, and Package Types. It emphasizes:

* Automatic shortest-hop trip route generation (BFS across `PossibleRoute` edges)
* Strict immutability of trip legs after creation (route is read-only)
* Driver-to-leg assignment with validation against rank eligibility
* Parcel movement across trip legs without storing redundant origin/destination data
* Depth-controlled population (`?deep` / `?shallow`) to limit payload size
* Journey-based seeding via `src/seed/test-data.ts` using only HTTP calls

## 2. Domain Model Summary
| Entity | Purpose | Key Relationships |
|--------|---------|-------------------|
| TaxiRank | Physical rank / node | Has many outgoing `PossibleRoute` edges; can link `TaxiAssociation` |
| PossibleRoute | Directed edge from one rank to another with `distance` + `farePrice` | `fromRank` -> `toRank` (reverse is auto-created) |
| TaxiAssociation | Organization managing drivers/marshalls | Optional `BankingDetails`; linkable to ranks |
| BankingDetails | Account metadata | Linked to `TaxiAssociation` or a `Driver` |
| Driver | Operates taxis | Links multiple ranks (`linkedRanks`), an association, banking details; can be assigned per trip leg |
| Marshall | Oversees operations at a rank | Links single rank + optional association |
| PackageType | Lookup for parcel classification | Referenced inside `parcel.package.type` |
| Parcel | Shipped item | References `package.type`; optionally linked to a trip leg (`trip` + `legIndex`); server generates `trackingNumber` & `receiverOtp` |
| Trip | Multi-leg journey | Server auto-generates legs from `origin` -> `destination`; legs contain `details` (PossibleRoute) and optional `driver` |

### Removed / Deprecated Fields
Parcel no longer stores: `originRank`, `destinationRank`, `possibleRoute`, or `price`. All contextual route information is derived from its linked trip leg.

## 3. Trip Auto-Generation & Leg Semantics
`POST /api/trip-details` accepts only:
```json
{ "price": 123.45, "origin": "<TaxiRankId>", "destination": "<TaxiRankId>" }
```
The server performs a BFS to find the shortest-hop path between ranks. For each hop an immutable leg is created. Stored fields:
* `route[]` (readOnly): legs with `leg`, `associationSplit` (default 0), `driverSplit` (default 0), `details` (PossibleRoute reference), optional `driver`
* `fullDistance` (readOnly): Sum of `distance` across leg `details`

You CANNOT supply custom legs or modify them after creation. To add drivers use the driver linking endpoints.

### Driver ↔ Trip Leg Linking
* `POST /api/trip-details/link-driver` `{ tripId, leg, driverId }`
  * Validates the driver has a linked rank matching the leg's `fromRank` (origin of its `PossibleRoute`).
* `POST /api/trip-details/unlink-driver` `{ tripId, leg }`
  * Removes driver assignment from that leg.

If no eligible driver exists for a leg, linking returns a validation error.

## 4. Parcel Lifecycle & Movement
`POST /api/parcel-details` creates a parcel with an embedded package object:
```json
{
  "senderIdNumber": "8001011234567",
  "senderFirstName": "Thabo",
  "senderLastName": "Mokoena",
  "senderPhone": "+27 81 555 1234",
  "receiverPhone": "+27 72 555 9876",
  "package": { "identifier": "PKG-ABC123", "type": "<PackageTypeId>" },
  "trip": "<TripId?>",
  "legIndex": 0
}
```
Server responses include `trackingNumber` and `receiverOtp` (readOnly).

Move a parcel to another leg (and optionally a different trip):
* `POST /api/parcel-details/move-leg` `{ parcelId, legIndex, tripId? }`

## 5. Depth-Controlled Population
| Resource | Query Param | Default | Deep Population Adds |
|----------|-------------|---------|----------------------|
| Trip | `?deep=true` | Shallow | origin, destination, route.driver, route.association, route.details (with fromRank & toRank) |
| Parcel | `?deep=true` | Shallow | package.type, trip (deep trip population) |
| TaxiRank | `?shallow=true` | Deep | Shallow omits nested rank docs in `possibleRoutes` and banking in associations |

## 6. Filtering Values Endpoints
Lightweight lookups (id + label) for UI / seeding:
* `GET /api/taxi-ranks/filtering-values`
* `GET /api/taxi-associations/filtering-values`
* `GET /api/driver-details/filtering-values`
* `GET /api/package-types/filtering-values`

## 7. Seeding (Journey Script)
Run the journey-based seeding script which exercises only HTTP endpoints:
```bash
npm run dev      # start API
npm run seed     # executes src/seed/test-data.ts
```
Journeys executed in order:
1. Package Types
2. Associations + Banking (and link banking to associations)
3. Taxi Ranks
4. Rank ↔ Association Linking
5. Possible Routes (forward + auto-generated reverse)
6. Drivers (with banking + association + rank links)
7. Marshalls
8. Trips (auto-generated path; afterward driver leg linking with validation)
9. Parcels (optional trip leg linkage at creation)

## 8. Error Handling Contract
All error responses:
```json
{ "message": "Human readable summary", "error": "Optional debug detail" }
```

## 9. Swagger / OpenAPI Notes
Important schema properties:
* Trip: `route` (array, readOnly), `fullDistance` (number, readOnly)
* Parcel: `trackingNumber` & `receiverOtp` (readOnly), `trip` optional
* PossibleRoute: `farePrice`, `distance`, `fromRank`, `toRank` (reverse created automatically by rank destination linking endpoint)
* Driver linking endpoint enforces origin rank eligibility

## 10. Driver & Marshall Operations
Driver endpoints allow linking/unlinking of ranks, banking details, and associations; responses are populated. Marshall endpoints similarly link rank & association.

## 11. File Uploads (Driver)
Endpoints (ID document, permit, license disk, photo) use memory storage; persist to durable storage (S3 / local disk) in future.

## 12. Extensibility Roadmap
* Pagination & selective projections (`fields` query) for high-volume lists
* Caching deep trip responses
* Rate limiting & auth (JWT) layer
* Soft deletes and audit trails for compliance
* Bulk driver assignment heuristics (e.g., capacity / availability tracking)

## 13. Running Locally
```bash
npm install
npm run dev
```
Environment variables:
```bash
MONGO_URI=mongodb://localhost:27017/nedparcel
PORT=3000
```

## 14. Quick Reference (Core Endpoints)
| Action | Method | Path |
|--------|--------|------|
| Create Trip | POST | /api/trip-details |
| Link Driver to Leg | POST | /api/trip-details/link-driver |
| Unlink Driver from Leg | POST | /api/trip-details/unlink-driver |
| Move Parcel Leg | POST | /api/parcel-details/move-leg |
| Link Rank Destination (creates forward + reverse) | POST | /api/taxi-ranks/link-destination |
| Link Rank Association | POST | /api/taxi-ranks/link-association |

## 15. License
Proprietary / Internal Use Only

