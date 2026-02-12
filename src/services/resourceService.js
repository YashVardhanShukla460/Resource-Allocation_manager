const Tenant = require("../models/Tenant");
const Policy = require("../models/Policy");
const AllocationEvent = require("../models/AllocationEvent");
const { defaultResources, defaultUtilizationThreshold, defaultProvisionStep } = require("../config/env");
const { RESOURCE_KEYS, normalize, add, subtractFloorZero, sumByKey, computeFairShareCap } = require("./fairShare");
const { tryTrackPolicyChange } = require("../utils/policyGit");
const { runProvisionScript } = require("../utils/provisionRunner");

async function getOrCreatePolicy() {
  let policy = await Policy.findOne({ name: "default" });
  if (!policy) {
    policy = await Policy.create({
      name: "default",
      totalResources: normalize(defaultResources),
      utilizationThreshold: defaultUtilizationThreshold,
      provisionStep: normalize(defaultProvisionStep),
      updatedBy: "system"
    });
  }
  return policy;
}

async function getStatus() {
  const [policy, tenants] = await Promise.all([getOrCreatePolicy(), Tenant.find({}).lean()]);
  const totalAllocated = sumByKey(tenants, (t) => t.allocated);
  const totalUsage = sumByKey(tenants, (t) => t.usage);
  const free = subtractFloorZero(policy.totalResources, totalAllocated);

  const utilization = {};
  for (const key of RESOURCE_KEYS) {
    const total = policy.totalResources[key] || 0;
    utilization[key] = total === 0 ? 0 : Number(((totalUsage[key] / total) * 100).toFixed(2));
  }

  return {
    policy,
    tenants,
    totals: {
      capacity: normalize(policy.totalResources),
      allocated: totalAllocated,
      usage: totalUsage,
      free
    },
    utilization
  };
}

function validatePositiveRequest(resource) {
  const normalized = normalize(resource);
  for (const key of RESOURCE_KEYS) {
    if (normalized[key] < 0) {
      throw new Error(`Invalid ${key} value`);
    }
  }
  if (RESOURCE_KEYS.every((key) => normalized[key] === 0)) {
    throw new Error("At least one resource must be greater than 0");
  }
  return normalized;
}

async function allocate(tenantId, request, reason = "") {
  const desired = validatePositiveRequest(request);
  const [policy, tenants] = await Promise.all([getOrCreatePolicy(), Tenant.find({})]);

  const tenant = tenants.find((t) => String(t._id) === String(tenantId));
  if (!tenant) {
    throw new Error("Tenant not found");
  }

  const totalAllocated = sumByKey(tenants, (t) => t.allocated);
  const totalFree = subtractFloorZero(policy.totalResources, totalAllocated);
  const fairShareCap = computeFairShareCap(tenant, tenants, policy.totalResources);
  const hardLimit = normalize(tenant.hardLimits);
  const allocated = normalize(tenant.allocated);

  const allocatable = {};
  for (const key of RESOURCE_KEYS) {
    const byHardLimit = Math.max(0, hardLimit[key] - allocated[key]);
    const byFairShare = Math.max(0, fairShareCap[key] - allocated[key]);
    allocatable[key] = Math.max(0, Math.min(totalFree[key], byHardLimit, byFairShare));
  }

  const denied = RESOURCE_KEYS.filter((key) => desired[key] > allocatable[key]);
  if (denied.length > 0) {
    const reasonText = denied
      .map((key) => `${key}: requested=${desired[key]}, allowed=${Number(allocatable[key].toFixed(2))}`)
      .join("; ");
    const error = new Error(`Allocation denied by fair-share or limits. ${reasonText}`);
    error.code = 409;
    throw error;
  }

  tenant.allocated = add(allocated, desired);
  await tenant.save();

  await AllocationEvent.create({
    tenantId: tenant._id,
    action: "ALLOCATE",
    delta: desired,
    snapshot: normalize(tenant.allocated),
    reason
  });

  return tenant;
}

async function release(tenantId, releaseRequest, reason = "") {
  const releaseAmount = validatePositiveRequest(releaseRequest);
  const tenant = await Tenant.findById(tenantId);
  if (!tenant) {
    throw new Error("Tenant not found");
  }

  tenant.allocated = subtractFloorZero(tenant.allocated, releaseAmount);
  tenant.usage = subtractFloorZero(tenant.usage, releaseAmount);
  await tenant.save();

  await AllocationEvent.create({
    tenantId: tenant._id,
    action: "RELEASE",
    delta: releaseAmount,
    snapshot: normalize(tenant.allocated),
    reason
  });

  return tenant;
}

async function updateUsage(tenantId, usage, reason = "") {
  const normalizedUsage = normalize(usage);
  const tenant = await Tenant.findById(tenantId);
  if (!tenant) {
    throw new Error("Tenant not found");
  }

  const allocated = normalize(tenant.allocated);
  const bounded = {};
  for (const key of RESOURCE_KEYS) {
    bounded[key] = Math.min(normalizedUsage[key], allocated[key]);
  }

  tenant.usage = bounded;
  await tenant.save();

  await AllocationEvent.create({
    tenantId: tenant._id,
    action: "USAGE_UPDATE",
    delta: bounded,
    snapshot: normalize(tenant.allocated),
    reason
  });

  return tenant;
}

async function createTenant(payload) {
  const hardLimits = validatePositiveRequest(payload.hardLimits || defaultResources);
  const weight = Math.max(1, Number(payload.weight) || 1);

  const tenant = await Tenant.create({
    name: payload.name,
    weight,
    hardLimits,
    allocated: normalize({}),
    usage: normalize({})
  });

  return tenant;
}

async function updatePolicy(patch = {}) {
  const policy = await getOrCreatePolicy();

  if (patch.totalResources) {
    policy.totalResources = normalize(patch.totalResources);
  }
  if (patch.provisionStep) {
    policy.provisionStep = normalize(patch.provisionStep);
  }
  if (patch.utilizationThreshold !== undefined) {
    const value = Number(patch.utilizationThreshold);
    if (!Number.isFinite(value) || value < 1 || value > 100) {
      throw new Error("utilizationThreshold must be between 1 and 100");
    }
    policy.utilizationThreshold = value;
  }
  if (patch.updatedBy) {
    policy.updatedBy = String(patch.updatedBy);
  }

  await policy.save();
  tryTrackPolicyChange(policy.toObject(), `update by ${policy.updatedBy || "unknown"}`);
  return policy;
}

async function provision(delta, reason = "autoscale") {
  const normalizedDelta = validatePositiveRequest(delta);
  const policy = await getOrCreatePolicy();
  policy.totalResources = add(policy.totalResources, normalizedDelta);
  await policy.save();
  tryTrackPolicyChange(policy.toObject(), `provision (${reason})`);

  const tenant = await Tenant.findOne();
  if (tenant) {
    await AllocationEvent.create({
      tenantId: tenant._id,
      action: "PROVISION",
      delta: normalizedDelta,
      snapshot: normalize(tenant.allocated),
      reason
    });
  }

  return policy;
}

async function autoProvisionIfNeeded(trigger = "autoscale-check") {
  const status = await getStatus();
  const threshold = Number(status.policy.utilizationThreshold || 80);

  const overThreshold = RESOURCE_KEYS.some((key) => Number(status.utilization[key] || 0) >= threshold);
  if (!overThreshold) {
    return { triggered: false, reason: "below-threshold", utilization: status.utilization };
  }

  const step = normalize(status.policy.provisionStep);
  const scriptOk = await runProvisionScript({
    reason: trigger,
    threshold,
    utilization: status.utilization,
    provisionStep: step
  });

  if (!scriptOk) {
    const error = new Error("Provision script failed");
    error.code = 500;
    throw error;
  }

  const updated = await provision(step, trigger);
  return {
    triggered: true,
    reason: "threshold-exceeded",
    utilization: status.utilization,
    policy: updated
  };
}

module.exports = {
  getOrCreatePolicy,
  getStatus,
  createTenant,
  allocate,
  release,
  updateUsage,
  updatePolicy,
  provision,
  autoProvisionIfNeeded
};
