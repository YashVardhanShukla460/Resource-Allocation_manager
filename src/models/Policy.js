const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema(
  {
    cpu: { type: Number, required: true, min: 0 },
    memory: { type: Number, required: true, min: 0 },
    storage: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const policySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, default: "default" },
    totalResources: { type: resourceSchema, required: true },
    provisionStep: { type: resourceSchema, required: true },
    utilizationThreshold: { type: Number, required: true, min: 1, max: 100 },
    updatedBy: { type: String, default: "system" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Policy", policySchema);
