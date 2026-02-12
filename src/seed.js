const { connectDb } = require("./config/db");
const Tenant = require("./models/Tenant");
const Policy = require("./models/Policy");
const { normalize } = require("./services/fairShare");

async function run() {
  await connectDb();

  await Policy.findOneAndUpdate(
    { name: "default" },
    {
      name: "default",
      totalResources: normalize({ cpu: 100, memory: 256000, storage: 1000000 }),
      provisionStep: normalize({ cpu: 10, memory: 16000, storage: 50000 }),
      utilizationThreshold: 80,
      updatedBy: "seed"
    },
    { upsert: true, returnDocument: "after" }
  );

  const tenants = [
    { name: "tenant-a", weight: 2, hardLimits: normalize({ cpu: 60, memory: 128000, storage: 500000 }) },
    { name: "tenant-b", weight: 1, hardLimits: normalize({ cpu: 40, memory: 96000, storage: 300000 }) },
    { name: "tenant-c", weight: 1, hardLimits: normalize({ cpu: 30, memory: 64000, storage: 200000 }) }
  ];

  for (const tenant of tenants) {
    await Tenant.findOneAndUpdate(
      { name: tenant.name },
      {
        ...tenant,
        allocated: normalize({}),
        usage: normalize({})
      },
      { upsert: true, returnDocument: "after" }
    );
  }

  console.log("Seed complete.");
  process.exit(0);
}

run().catch((error) => {
  console.error("Seed failed:", error.message);
  process.exit(1);
});
