const dotenv = require("dotenv");

dotenv.config();

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

module.exports = {
  port: toNumber(process.env.PORT, 3000),
  mongoUri: process.env.MONGODB_URI,
  defaultResources: {
    cpu: toNumber(process.env.DEFAULT_CPU, 100),
    memory: toNumber(process.env.DEFAULT_MEMORY, 256000),
    storage: toNumber(process.env.DEFAULT_STORAGE, 1000000)
  },
  defaultUtilizationThreshold: toNumber(process.env.DEFAULT_UTILIZATION_THRESHOLD, 80),
  defaultProvisionStep: {
    cpu: toNumber(process.env.DEFAULT_PROVISION_CPU, 10),
    memory: toNumber(process.env.DEFAULT_PROVISION_MEMORY, 16000),
    storage: toNumber(process.env.DEFAULT_PROVISION_STORAGE, 50000)
  },
  provisionScript: process.env.PROVISION_SCRIPT || "./scripts/provision-resources.sh",
  enableGitPolicyTracking: String(process.env.ENABLE_GIT_POLICY_TRACKING || "false").toLowerCase() === "true"
};
