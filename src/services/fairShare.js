const RESOURCE_KEYS = ["cpu", "memory", "storage"];

function normalize(resource = {}) {
  const output = {};
  for (const key of RESOURCE_KEYS) {
    const value = Number(resource[key] ?? 0);
    output[key] = Number.isFinite(value) && value >= 0 ? value : 0;
  }
  return output;
}

function add(a, b) {
  const left = normalize(a);
  const right = normalize(b);
  return {
    cpu: left.cpu + right.cpu,
    memory: left.memory + right.memory,
    storage: left.storage + right.storage
  };
}

function subtractFloorZero(a, b) {
  const left = normalize(a);
  const right = normalize(b);
  return {
    cpu: Math.max(0, left.cpu - right.cpu),
    memory: Math.max(0, left.memory - right.memory),
    storage: Math.max(0, left.storage - right.storage)
  };
}

function sumByKey(items, selector) {
  return items.reduce((acc, item) => add(acc, selector(item)), normalize({}));
}

function computeFairShareCap(tenant, tenants, totalResources) {
  const normalizedTotal = normalize(totalResources);
  const totalWeight = tenants.reduce((acc, t) => acc + Math.max(1, Number(t.weight) || 1), 0);
  const tenantWeight = Math.max(1, Number(tenant.weight) || 1);

  if (totalWeight <= 0) {
    return normalizedTotal;
  }

  return {
    cpu: (tenantWeight / totalWeight) * normalizedTotal.cpu,
    memory: (tenantWeight / totalWeight) * normalizedTotal.memory,
    storage: (tenantWeight / totalWeight) * normalizedTotal.storage
  };
}

module.exports = {
  RESOURCE_KEYS,
  normalize,
  add,
  subtractFloorZero,
  sumByKey,
  computeFairShareCap
};
