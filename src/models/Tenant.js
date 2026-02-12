const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema(
  {
    cpu: { type: Number, default: 0, min: 0 },
    memory: { type: Number, default: 0, min: 0 },
    storage: { type: Number, default: 0, min: 0 }
  },
  { _id: false }
);

const tenantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    weight: { type: Number, default: 1, min: 1 },
    hardLimits: { type: resourceSchema, default: () => ({}) },
    allocated: { type: resourceSchema, default: () => ({}) },
    usage: { type: resourceSchema, default: () => ({}) }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Tenant", tenantSchema);
