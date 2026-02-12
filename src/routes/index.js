const express = require("express");
const {
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
} = require("../controllers/resourceController");

const router = express.Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

router.post("/tenants", createTenantHandler);
router.get("/tenants", listTenantsHandler);

router.post("/allocations", allocateHandler);
router.post("/allocations/release", releaseHandler);
router.post("/usage", usageHandler);

router.get("/resources/status", statusHandler);

router.get("/policy", getPolicyHandler);
router.put("/policy", updatePolicyHandler);

router.post("/admin/provision", provisionHandler);
router.post("/admin/autoscale-check", autoProvisionCheckHandler);

module.exports = router;
