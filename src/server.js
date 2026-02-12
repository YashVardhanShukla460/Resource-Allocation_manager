const app = require("./app");
const { connectDb } = require("./config/db");
const { port } = require("./config/env");

async function start() {
  await connectDb();
  app.listen(port, () => {
    console.log(`Resource Allocation Manager listening on port ${port}`);
  });
}

start().catch((error) => {
  console.error("Failed to start server:", error.message);
  process.exit(1);
});
