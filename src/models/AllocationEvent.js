const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema(
  {
    cpu: { type: Number, required: true },
    memory: { type: Number, required: true },
    storage: { type: Number, required: true }
  },
  { _id: false }
);

const allocationEventSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true },
    action: { type: String, enum: ["ALLOCATE", "RELEASE", "USAGE_UPDATE", "PROVISION"], required: true },
    delta: { type: resourceSchema, required: true },
    snapshot: { type: resourceSchema, required: true },
    reason: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("AllocationEvent", allocationEventSchema);
