/**
 * JOURNEY-BASED SEEDING SCRIPT
 * ---------------------------------------------------------------
 * This script exercises the public REST API (NOT direct Mongo writes)
 * to build up a coherent sample dataset in clearly defined "journeys".
 * Each journey lists, in order, the API endpoints it calls so a newcomer
 * can understand which HTTP requests are necessary to achieve a higher 
 * level business outcome.
 *
 * RUN REQUIREMENTS
 * 1. Start the API server (e.g.):
 *      npm run dev
 * 2. In a second terminal run:
 *      npm run seed
 *
 * DATA INPUT
 *  JSON fixture files under: src/seed/data/*.json
 *
 * JOURNEY OVERVIEW (sequence matters due to dependencies):
 *  1. Package Types Journey
 *     - POST /api/package-types
 *  2. Associations + Banking Journey
 *     - POST /api/taxi-associations
 *     - POST /api/banking-details
 *     - POST /api/taxi-associations/link-banking
 *  3. Taxi Ranks Journey
 *     - POST /api/taxi-ranks
 *  4. Rank ↔ Association Linking Journey
 *     - POST /api/taxi-ranks/link-association
 *  5. Possible Routes Journey (creates forward + reverse)
 *     - POST /api/taxi-ranks/link-destination
 *  6. Drivers Journey (drivers + banking + associations + ranks)
 *     - POST /api/driver-details
 *     - POST /api/banking-details
 *     - POST /api/driver-details/link-banking
 *     - POST /api/driver-details/link-association
 *     - POST /api/driver-details/link-rank
 *  7. Marshalls Journey
 *     - POST /api/marshall-details
 *     - POST /api/marshall-details/link-rank
 *     - POST /api/marshall-details/link-association
 *  8. Trips Journey (auto-generated route, then leg driver linking)
 *     - GET  /api/taxi-ranks (to build adjacency graph)
 *     - GET  /api/driver-details (to choose eligible drivers per leg)
 *     - POST /api/trip-details (price, origin, destination only; route auto-generated)
 *     - POST /api/trip-details/link-driver (per leg; validates driver linked to leg's origin rank)
 *  9. Parcels Journey (links to trip leg when possible)
 *     - POST /api/parcel-details
 *
 * The output console log gives a compact summary at the end.
 * Each journey also logs a bordered summary with counts & timing.
 */

import fs from "fs";
import path from "path";

const API_BASE = "http://localhost:3000/api";

interface CreatedEntityLog {
  type: string;
  name?: string;
  _id: string;
  extra?: Record<string, any>;
}

const created: CreatedEntityLog[] = [];

// Basic timing + logging helpers -------------------------------------------
interface JourneyContext {
  name: string;
  started: number;
  logs: string[];
  success: number;
  failed: number;
}

function startJourney(name: string): JourneyContext {
  console.log(`\n=== JOURNEY: ${name} ===`);
  return { name, started: Date.now(), logs: [], success: 0, failed: 0 };
}

function journeyInfo(ctx: JourneyContext, msg: string) {
  ctx.logs.push(msg);
  console.log(msg);
}

function journeyResult(ctx: JourneyContext, ok: boolean, msg: string) {
  ok ? ctx.success++ : ctx.failed++;
  journeyInfo(ctx, `${ok ? "✔" : "✖"} ${msg}`);
}

function endJourney(ctx: JourneyContext) {
  const dur = Date.now() - ctx.started;
  const border = "-".repeat(60);
  console.log(border);
  console.log(
    `Journey '${ctx.name}' complete: success=${ctx.success} failed=${ctx.failed} duration=${dur}ms`
  );
  console.log(border);
}

function readJson<T = any>(filename: string): T {
  const filePath = path.join(__dirname, "data", filename);
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

async function postJSON(url: string, body: any) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST ${url} failed: ${res.status} ${text}`);
  }
  return res.json();
}

async function getJSON(url: string) {
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GET ${url} failed: ${res.status} ${text}`);
  }
  return res.json();
}

async function journeyPackageTypes() {
  const ctx = startJourney("Package Types");
  const data = readJson<any[]>("PackageType.json");
  for (const pkg of data) {
    try {
      const createdPkg = await postJSON(`${API_BASE}/package-types`, pkg);
      created.push({ type: "PackageType", name: createdPkg.name, _id: createdPkg._id });
      journeyResult(ctx, true, `Created package type ${createdPkg.name}`);
    } catch (e: any) {
      journeyResult(ctx, false, `PackageType create failed ${pkg.sku}: ${e.message}`);
    }
  }
  endJourney(ctx);
}

async function journeyAssociationsAndBanking() {
  const ctx = startJourney("Associations + Banking");
  const associations = readJson<any[]>("Associations.json");
  const banking = readJson<any[]>("BankingDetails.json");
  // Filter out accidental nested array if exists
  const flattenedBanking = banking.flat
    ? banking.flat(Infinity).filter((b: any) => b.accountHolder)
    : banking;

  for (const assoc of associations) {
    let createdAssoc;
    try {
      createdAssoc = await postJSON(`${API_BASE}/taxi-associations`, assoc);
      created.push({ type: "TaxiAssociation", name: createdAssoc.name, _id: createdAssoc._id });
      journeyResult(ctx, true, `Association ${createdAssoc.name}`);
    } catch (e: any) {
      journeyResult(ctx, false, `Association create failed ${assoc.name}: ${e.message}`);
      continue;
    }
    // match banking by accountHolder === association name
    const matchBank = flattenedBanking.find(
      (b: any) => b.accountHolder === createdAssoc.name
    );
    if (matchBank) {
      try {
        const bankRes = await postJSON(
          `${API_BASE}/banking-details`,
          matchBank
        );
        created.push({
          type: "BankingDetails",
          name: bankRes.accountHolder,
          _id: bankRes._id,
        });
        // Controller expects associationId (not taxiAssociationId) for link-banking
        await postJSON(`${API_BASE}/taxi-associations/link-banking`, {
          associationId: createdAssoc._id,
          bankingDetailsId: bankRes._id,
        });
      } catch (e: any) {
        journeyResult(ctx, false, `Banking link failed ${createdAssoc.name}: ${e.message}`);
      }
    }
  }
  endJourney(ctx);
}

async function journeyTaxiRanks() {
  const ctx = startJourney("Taxi Ranks");
  const ranks = readJson<any[]>("Ranks.json");
  for (const rank of ranks) {
    try {
      const createdRank = await postJSON(`${API_BASE}/taxi-ranks`, rank);
      created.push({
        type: "TaxiRank",
        name: createdRank.name,
        _id: createdRank._id,
      });
      journeyResult(ctx, true, `Rank ${createdRank.name}`);
    } catch (e: any) {
      journeyResult(ctx, false, `Rank create failed ${rank.name}: ${e.message}`);
    }
  }
  endJourney(ctx);
}

// Link each rank to a random association (if any exist)
async function journeyLinkRankAssociations() {
  const ctx = startJourney("Rank ↔ Association Linking");
  // Use filtering-values endpoints instead of in-memory created list
  let ranks: any[] = [];
  let associations: any[] = [];
  try {
    ranks = await getJSON(`${API_BASE}/taxi-ranks/filtering-values`);
    associations = await getJSON(`${API_BASE}/taxi-associations/filtering-values`);
  } catch (e: any) {
    journeyResult(ctx, false, `Failed fetching filtering values: ${e.message}`);
    endJourney(ctx);
    return;
  }
  if (!ranks.length || !associations.length) {
    journeyInfo(ctx, "Skipping rank-association linking (no ranks or associations)");
    endJourney(ctx);
    return;
  }
  for (const rank of ranks) {
    const assoc = associations[Math.floor(Math.random() * associations.length)];
    try {
      await postJSON(`${API_BASE}/taxi-ranks/link-association`, {
        taxiRankId: rank.id || rank._id,
        associationId: assoc.id || assoc._id,
      });
      const rankName = rank.name || rank.id;
      const assocName = assoc.name || assoc.id;
      journeyResult(ctx, true, `Linked rank ${rankName} -> assoc ${assocName}`);
    } catch (e: any) {
      const rankName = rank.name || rank.id;
      const assocName = assoc.name || assoc.id;
      journeyResult(ctx, false, `Link failed rank ${rankName} -> ${assocName}: ${e.message}`);
    }
  }
  endJourney(ctx);
}

// Create random possible routes with symmetric reverse routes
async function journeyPossibleRoutes() {
  const ctx = startJourney("Possible Routes (forward + reverse)");
  const rankEntries = created.filter((c) => c.type === "TaxiRank");
  if (rankEntries.length < 2) return;
  const maxRoutes = Math.min(20, rankEntries.length * 3);
  const usedPairs = new Set<string>();
  for (let i = 0; i < maxRoutes; i++) {
    const from = rankEntries[Math.floor(Math.random() * rankEntries.length)];
    let to = from;
    let guard = 0;
    while (to._id === from._id && guard < 5) {
      to = rankEntries[Math.floor(Math.random() * rankEntries.length)];
      guard++;
    }
    if (to._id === from._id) continue;
    const key = `${from._id}->${to._id}`;
    if (usedPairs.has(key)) continue;
  const farePrice = Number((20 + Math.random() * 50).toFixed(2));
  const distance = Number((2 + Math.random() * 40).toFixed(1));
  // Derived package movement price may differ from passenger fare
  const price = Number((farePrice * (0.8 + Math.random() * 0.6)).toFixed(2));
  const driverSplit = Math.floor(20 + Math.random() * 40); // simplistic percentage share
  const associationSplit = 100 - driverSplit;
    try {
      usedPairs.add(key);
      await postJSON(`${API_BASE}/taxi-ranks/link-destination`, {
        taxiRankId: from._id,
        destinationRankId: to._id,
        farePrice,
        price,
        driverSplit,
        associationSplit,
        distance,
      });
      created.push({ type: "PossibleRoute", _id: key, name: `${from.name} -> ${to.name}` });
      journeyResult(ctx, true, `Route ${from.name} -> ${to.name}`);
      const reverseKey = `${to._id}->${from._id}`;
      if (!usedPairs.has(reverseKey)) {
        usedPairs.add(reverseKey);
        await postJSON(`${API_BASE}/taxi-ranks/link-destination`, {
          taxiRankId: to._id,
          destinationRankId: from._id,
          farePrice,
          price,
          driverSplit,
          associationSplit,
          distance,
        });
        created.push({ type: "PossibleRoute", _id: reverseKey, name: `${to.name} -> ${from.name}` });
        journeyResult(ctx, true, `Route ${to.name} -> ${from.name}`);
      }
    } catch (e: any) {
      journeyResult(ctx, false, `Route create failed ${from.name} -> ${to.name}: ${e.message}`);
    }
  }
  endJourney(ctx);
}

// Create sample parcels referencing ranks, package types and random routes
async function journeyParcels() {
  const ctx = startJourney("Parcels (with optional trip leg link)");
  const ranks = created.filter((c) => c.type === "TaxiRank");
  const pkgTypes = created.filter((c) => c.type === "PackageType");
  const routes = created.filter((c) => c.type === "PossibleRoute");
  const trips = created.filter((c) => c.type === "Trip");
  if (!ranks.length || !pkgTypes.length) return;

  const parseRoute = (k: string) => {
    const [fromId, toId] = k.split("->");
    return { fromId, toId };
  };
  const parcelCount = Math.min(10, Math.max(3, routes.length || 5));
  for (let i = 0; i < parcelCount; i++) {
    const routeEntry = routes.length
      ? routes[Math.floor(Math.random() * routes.length)]
      : undefined;
    const pkg = pkgTypes[Math.floor(Math.random() * pkgTypes.length)];
    const senderFirstNames = [
      "Thabo",
      "Lerato",
      "Sipho",
      "Nomsa",
      "Kgomotso",
      "Jabu",
    ];
    const senderLastNames = [
      "Mokoena",
      "Dlamini",
      "Pillay",
      "Nkosi",
      "Naidoo",
      "Botha",
    ];
    const senderFirstName =
      senderFirstNames[Math.floor(Math.random() * senderFirstNames.length)];
    const senderLastName =
      senderLastNames[Math.floor(Math.random() * senderLastNames.length)];
    const senderIdNumber = `8${Math.floor(Math.random() * 9)}0101${Math.floor(
      Math.random() * 9000000 + 1000000
    )}`;
    const senderPhone = `+27 8${Math.floor(Math.random() * 9)} ${Math.floor(
      100 + Math.random() * 900
    )} ${Math.floor(1000 + Math.random() * 9000)}`;
    const receiverPhone = `+27 7${Math.floor(Math.random() * 9)} ${Math.floor(
      100 + Math.random() * 900
    )} ${Math.floor(1000 + Math.random() * 9000)}`;
    const notes = Math.random() < 0.25 ? "Fragile" : undefined;
    try {
      // Attempt to link parcel to an existing trip leg if available
      let tripRef: string | undefined;
      let legIndex: number | undefined;
  // leg details will implicitly provide route context via trip; no direct possibleRoute now
      if (trips.length) {
        const tripEntry = trips[Math.floor(Math.random() * trips.length)];
        // We need to GET the trip to inspect number of legs and route.details IDs
        try {
          const tripData = await getJSON(
            `${API_BASE}/trip-details/${tripEntry._id}`
          );
          if (Array.isArray(tripData.route) && tripData.route.length) {
            const chosenLegIndex = Math.floor(
              Math.random() * tripData.route.length
            );
            const leg = tripData.route[chosenLegIndex];
            if (leg && leg.details) {
              tripRef = tripEntry._id;
              legIndex = chosenLegIndex;
              // route.details captured implicitly through trip leg; no separate parcel field retained
            }
          }
        } catch (e: any) {
          // Non-fatal; parcel can still be created unlinked
          console.warn(
            "Trip fetch for parcel linkage failed",
            tripEntry._id,
            e.message
          );
        }
      }

      const payload: any = {
        senderIdNumber,
        senderFirstName,
        senderLastName,
        senderPhone,
        receiverPhone,
        package: {
          identifier: `PKG-${Math.random()
            .toString(36)
            .slice(2, 8)
            .toUpperCase()}`,
          type: pkg._id,
        },
      };
      if (tripRef && legIndex !== undefined) {
        payload.trip = tripRef;
        payload.legIndex = legIndex;
      }
      if (notes) payload.notes = notes;
      const parcel = await postJSON(`${API_BASE}/parcel-details`, payload);
      created.push({ type: "Parcel", _id: parcel._id, name: parcel.trackingNumber });
      journeyResult(
        ctx,
        true,
        `Parcel ${parcel.trackingNumber}${tripRef ? ` -> trip ${tripRef} leg ${legIndex}` : ""}`
      );
    } catch (e: any) {
      journeyResult(ctx, false, `Parcel create failed: ${e.message}`);
    }
  }
  endJourney(ctx);
}

async function journeyDrivers() {
  const ctx = startJourney("Drivers (with banking, association & ranks)");
  const drivers = readJson<any[]>("Drivers.json");
  // Fetch filtering values instead of using created[] for associations & ranks
  let assocList: any[] = [];
  let rankList: any[] = [];
  try {
    assocList = await getJSON(`${API_BASE}/taxi-associations/filtering-values`);
    rankList = await getJSON(`${API_BASE}/taxi-ranks/filtering-values`);
  } catch (e: any) {
    journeyResult(ctx, false, `Failed fetching filtering values for driver linking: ${e.message}`);
  }
  const bankingRaw = readJson<any[]>("BankingDetails.json");
  const flattenedBanking = bankingRaw.flat
    ? bankingRaw.flat(Infinity).filter((b: any) => b.accountHolder)
    : bankingRaw;

  let bankingIndex = 0;
  for (const driver of drivers) {
    try {
      const createdDriver = await postJSON(`${API_BASE}/driver-details`, driver);
      created.push({
        type: "Driver",
        name: `${createdDriver.firstName} ${createdDriver.lastName}`,
        _id: createdDriver._id,
      });

      // Create banking details for driver (round-robin through banking sample or generate synthetic)
      const bankSource =
        flattenedBanking[bankingIndex % flattenedBanking.length];
      bankingIndex++;
      const driverBankPayload = {
        accountHolder: `${createdDriver.firstName} ${createdDriver.lastName}`,
        bankName: bankSource.bankName,
        accountNumber: bankSource.accountNumber.slice(0, 10),
        branchCode: bankSource.branchCode,
      };
      const bankRes = await postJSON(
        `${API_BASE}/banking-details`,
        driverBankPayload
      );
      created.push({
        type: "BankingDetails",
        name: bankRes.accountHolder,
        _id: bankRes._id,
      });
      await postJSON(`${API_BASE}/driver-details/link-banking`, { driverId: createdDriver._id, bankingDetailsId: bankRes._id });

      // Link association (pick random)
      if (assocList.length) {
        const assoc = assocList[Math.floor(Math.random() * assocList.length)];
        // Controller expects taxiAssociationId (not associationId) for driver link-association
        await postJSON(`${API_BASE}/driver-details/link-association`, { driverId: createdDriver._id, taxiAssociationId: assoc.id || assoc._id });
      }

      // Link two ranks if available
      for (let i = 0; i < Math.min(2, rankList.length); i++) {
        const rank =
          rankList[
            (i + Math.floor(Math.random() * rankList.length)) % rankList.length
          ];
        await postJSON(`${API_BASE}/driver-details/link-rank`, { driverId: createdDriver._id, rankId: rank.id || rank._id });
      }
      journeyResult(ctx, true, `Driver ${createdDriver.firstName} ${createdDriver.lastName}`);
    } catch (e: any) {
      journeyResult(ctx, false, `Driver create failed ${driver.firstName} ${driver.lastName}: ${e.message}`);
    }
  }
  endJourney(ctx);
}

// Utility: build adjacency from possibleRoutes for BFS path discovery
function buildAdjacency(possibleRoutes: any[]) {
  const adj: Record<string, string[]> = {};
  for (const r of possibleRoutes) {
    const from = r.fromRank._id || r.fromRank;
    const to = r.toRank._id || r.toRank;
    const f = String(from);
    const t = String(to);
    adj[f] = adj[f] || [];
    if (!adj[f].includes(t)) adj[f].push(t);
  }
  return adj;
}

function bfsPath(adj: Record<string, string[]>, start: string, goal: string): string[] | null {
  if (start === goal) return [start];
  const q: string[] = [start];
  const prev: Record<string, string | null> = { [start]: null };
  while (q.length) {
    const cur = q.shift()!;
    if (cur === goal) break;
    for (const nxt of adj[cur] || []) {
      if (!(nxt in prev)) {
        prev[nxt] = cur;
        q.push(nxt);
      }
    }
  }
  if (!(goal in prev)) return null;
  const path: string[] = [];
  let c: string | null = goal;
  while (c) {
    path.push(c);
    c = prev[c];
  }
  return path.reverse();
}

// Create trips using new auto-generation logic then link eligible drivers to each leg
async function journeyTrips() {
  const ctx = startJourney("Trips (auto-generated + driver leg links)");
  try {
    const ranks: any[] = await getJSON(`${API_BASE}/taxi-ranks`); // includes possibleRoutes in shallow form
    const drivers: any[] = await getJSON(`${API_BASE}/driver-details`);
    // Extract route documents
    const routeDocs: any[] = [];
    for (const r of ranks) {
      if (Array.isArray(r.possibleRoutes)) {
        for (const route of r.possibleRoutes) {
          if (route && route._id && route.fromRank && route.toRank) {
            routeDocs.push(route);
          }
        }
      }
    }
    if (!routeDocs.length || !drivers.length) {
      journeyInfo(ctx, "Skipping trips (need routes & drivers)");
      endJourney(ctx);
      return;
    }
    const adj = buildAdjacency(routeDocs);
    const rankIds = ranks.map((r) => r._id);
    const tripCount = Math.min(5, Math.max(2, rankIds.length));

    for (let i = 0; i < tripCount; i++) {
      // Attempt to find a random origin/destination pair with a path
      let origin: string | undefined;
      let destination: string | undefined;
      let path: string[] | null = null;
      for (let attempt = 0; attempt < 10 && !path; attempt++) {
        origin = rankIds[Math.floor(Math.random() * rankIds.length)];
        destination = rankIds[Math.floor(Math.random() * rankIds.length)];
        if (origin === destination) continue;
        path = bfsPath(adj, String(origin), String(destination));
      }
      if (!path || !origin || !destination) {
        journeyResult(ctx, false, "Could not find path for trip candidate");
        continue;
      }
      // Estimate price: sum of distances on path edges (if available) else random
      let distanceSum = 0;
      for (let pi = 0; pi < path.length - 1; pi++) {
        const from = path[pi];
        const to = path[pi + 1];
        const match = routeDocs.find((rd) => String(rd.fromRank._id || rd.fromRank) === from && String(rd.toRank._id || rd.toRank) === to);
        if (match && match.distance) distanceSum += match.distance;
      }
      if (!distanceSum) distanceSum = 5 + Math.random() * 30;
      // Create trip (server auto-generates route & derives price)
      let trip: any;
      try {
        trip = await postJSON(`${API_BASE}/trip-details`, { origin, destination });
        created.push({ type: "Trip", _id: trip._id, name: `Trip-${i + 1}` });
        journeyResult(ctx, true, `Trip ${trip._id} created (path length=${path.length}, derived price=${trip.price})`);
      } catch (e: any) {
        journeyResult(ctx, false, `Trip create failed: ${e.message}`);
        continue;
      }
      // Fetch deep trip to inspect legs and fromRank for driver eligibility
      let deepTrip: any;
      try {
        deepTrip = await getJSON(`${API_BASE}/trip-details/${trip._id}?deep=true`);
      } catch (e: any) {
        journeyResult(ctx, false, `Deep fetch failed for trip ${trip._id}: ${e.message}`);
        continue;
      }
      if (!Array.isArray(deepTrip.route) || !deepTrip.route.length) {
        journeyResult(ctx, false, `Trip ${trip._id} has no route legs in deep response`);
        continue;
      }
      // For each leg choose driver whose linkedRanks contains fromRank of leg.details
      for (const legEntry of deepTrip.route) {
        const legNumber = legEntry.leg;
        // leg.details may be populated (with fromRank) due to deep=true
        const fromRankObj = legEntry.details?.fromRank;
        const fromRankId = fromRankObj?._id || fromRankObj || undefined;
        if (!fromRankId) continue;
        const eligibleDrivers = drivers.filter((d) => Array.isArray(d.linkedRanks) && d.linkedRanks.some((lr: any) => String(lr._id || lr) === String(fromRankId)));
        if (!eligibleDrivers.length) {
          journeyInfo(ctx, `No eligible driver for trip ${trip._id} leg ${legNumber}`);
          continue;
        }
        const chosenDriver = eligibleDrivers[Math.floor(Math.random() * eligibleDrivers.length)];
        try {
          await postJSON(`${API_BASE}/trip-details/link-driver`, { tripId: trip._id, leg: legNumber, driverId: chosenDriver._id });
        } catch (e: any) {
          journeyResult(ctx, false, `Driver link failed trip ${trip._id} leg ${legNumber}: ${e.message}`);
        }
      }
    }
  } catch (e: any) {
    journeyResult(ctx, false, `Trips journey failed: ${e.message}`);
  }
  endJourney(ctx);
}

async function journeyMarshalls() {
  const ctx = startJourney("Marshalls");
  const marshalls = readJson<any[]>("Marshalls.json");
  // Fetch filtering values for associations & ranks
  let assocList: any[] = [];
  let rankList: any[] = [];
  try {
    assocList = await getJSON(`${API_BASE}/taxi-associations/filtering-values`);
    rankList = await getJSON(`${API_BASE}/taxi-ranks/filtering-values`);
  } catch (e: any) {
    journeyResult(ctx, false, `Failed fetching filtering values for marshall linking: ${e.message}`);
  }
  for (const marshall of marshalls) {
    try {
      const createdMarshall = await postJSON(`${API_BASE}/marshall-details`, {
        firstName: marshall.firstName,
        lastName: marshall.lastName,
        phone: marshall.phone,
        status: marshall.status,
      });
      created.push({
        type: "Marshall",
        name: `${createdMarshall.firstName} ${createdMarshall.lastName}`,
        _id: createdMarshall._id,
      });
      if (rankList.length) {
        const rank = rankList[Math.floor(Math.random() * rankList.length)];
        await postJSON(`${API_BASE}/marshall-details/link-rank`, { marshallId: createdMarshall._id, taxiRankId: rank.id || rank._id });
      }
      if (assocList.length) {
        const assoc = assocList[Math.floor(Math.random() * assocList.length)];
        await postJSON(`${API_BASE}/marshall-details/link-association`, { marshallId: createdMarshall._id, taxiAssociationId: assoc.id || assoc._id });
      }
      journeyResult(ctx, true, `Marshall ${createdMarshall.firstName} ${createdMarshall.lastName}`);
    } catch (e: any) {
      journeyResult(ctx, false, `Marshall create failed ${marshall.firstName} ${marshall.lastName}: ${e.message}`);
    }
  }
  endJourney(ctx);
}

async function run() {
  console.log("Starting seeding journeys...");
  await journeyPackageTypes();
  await journeyAssociationsAndBanking();
  await journeyTaxiRanks();
  await journeyLinkRankAssociations();
  await journeyPossibleRoutes();
  await journeyDrivers();
  await journeyMarshalls();
  await journeyTrips();
  await journeyParcels();

  console.log("\nGLOBAL SUMMARY (all created entities)");
  const byType: Record<string, number> = {};
  for (const entry of created) byType[entry.type] = (byType[entry.type] || 0) + 1;
  Object.entries(byType)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([type, count]) => console.log(`${type.padEnd(18)} ${count}`));

  console.log("\nSample IDs:");
  created.slice(0, 20).forEach((e) => console.log(`${e.type}: ${e.name || "(no name)"} -> ${e._id}`));
}

run().catch((err) => {
  console.error("Seeding failed", err);
  process.exit(1);
});
