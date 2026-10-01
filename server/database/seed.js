// Manual full reseed: wipes facts and game_scenarios, then reinserts the starter data.
// Run with `npm run seed`. For normal server startup, db.js already auto-seeds any
// empty tables on its own — this script is only needed if you want to force-refresh
// the data (e.g. after editing seedData.js).
const db = require("./db");
const { seedDatabase } = require("./seedData");

const result = seedDatabase(db, { force: true });
console.log(`Seeded ${result.factsInserted} facts and ${result.scenariosInserted} game scenarios.`);
