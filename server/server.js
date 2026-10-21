const app = require("./app");
const db = require("./database/db");

const PORT = process.env.PORT || 5001;

// Start listening only once the database is reachable, so a bad connection fails loudly at boot.
db.ready
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Energize the Future API running on http://localhost:${PORT}`);
      console.log(`Database: ${db.isRemote ? "Turso (remote, persistent)" : "local SQLite file"}`);
    });
  })
  .catch((error) => {
    console.error("Could not start: database connection failed.", error.message);
    process.exit(1);
  });
