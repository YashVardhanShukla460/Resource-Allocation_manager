const Tenant = require("../models/Tenant");
const {
  getStatus,
  createTenant,
  allocate,
  release,
  updateUsage,
  updatePolicy,
  provision,
  getOrCreatePolicy,
  autoProvisionIfNeeded
} = require("../services/resourceService");

function asyncHandler(fn) {
  return async (req, res, next) => {
    try {
      await fn(req, res);
    } catch (error) {
      next(error);
    }
  };
}

const createTenantHandler = asyncHandler(async (req, res) => {
  const { name, weight, hardLimits } = req.body || {};
  if (!name) {
    return res.status(400).json({ message: "name is required" });
  }
  const tenant = await createTenant({ name, weight, hardLimits });
  res.status(201).json(tenant);
});

const listTenantsHandler = asyncHandler(async (_req, res) => {
  const tenants = await Tenant.find({}).sort({ createdAt: 1 });
  res.json(tenants);
});

const allocateHandler = asyncHandler(async (req, res) => {
  const { tenantId, request, reason } = req.body || {};
  if (!tenantId || !request) {
    return res.status(400).json({ message: "tenantId and request are required" });
  }
  const tenant = await allocate(tenantId, request, reason || "manual allocation");
  res.json(tenant);
});

const releaseHandler = asyncHandler(async (req, res) => {
  const { tenantId, release: releasePayload, reason } = req.body || {};
  if (!tenantId || !releasePayload) {
    return res.status(400).json({ message: "tenantId and release are required" });
  }
  const tenant = await release(tenantId, releasePayload, reason || "manual release");
  res.json(tenant);
});

const usageHandler = asyncHandler(async (req, res) => {
  const { tenantId, usage, reason } = req.body || {};
  if (!tenantId || !usage) {
    return res.status(400).json({ message: "tenantId and usage are required" });
  }
  const tenant = await updateUsage(tenantId, usage, reason || "usage report");
  res.json(tenant);
});

const statusHandler = asyncHandler(async (_req, res) => {
  const status = await getStatus();
  res.json(status);
});

const getPolicyHandler = asyncHandler(async (_req, res) => {
  const policy = await getOrCreatePolicy();
  res.json(policy);
});

const updatePolicyHandler = asyncHandler(async (req, res) => {
  const policy = await updatePolicy(req.body || {});
  res.json(policy);
});

const provisionHandler = asyncHandler(async (req, res) => {
  const { cpu = 0, memory = 0, storage = 0, reason = "manual provision" } = req.body || {};
  const policy = await provision({ cpu, memory, storage }, reason);
  res.json(policy);
});

const autoProvisionCheckHandler = asyncHandler(async (_req, res) => {
  const result = await autoProvisionIfNeeded("api-autoscale-check");
  res.json(result);
});

module.exports = {
  createTenantHandler,
  listTenantsHandler,
  allocateHandler,
  releaseHandler,
  usageHandler,
  statusHandler,
  getPolicyHandler,
  updatePolicyHandler,
  provisionHandler,
  autoProvisionCheckHandler
};
