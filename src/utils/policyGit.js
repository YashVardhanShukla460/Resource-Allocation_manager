const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

function isEnabled(value) {
  return String(value || "").toLowerCase() === "true";
}

function tryTrackPolicyChange(policy, reason) {
  if (!isEnabled(process.env.ENABLE_GIT_POLICY_TRACKING)) {
    return;
  }

  try {
    execSync("git rev-parse --is-inside-work-tree", { stdio: "ignore" });

    const outDir = path.resolve("policies");
    const filePath = path.join(outDir, "current.json");
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(policy, null, 2));

    const relFile = path.relative(process.cwd(), filePath);
    execSync(`git add "${relFile}"`, { stdio: "ignore" });
    execSync(`git commit -m "policy: ${reason}"`, { stdio: "ignore" });
  } catch (_error) {
    // Best effort: runtime behavior should not fail if git is unavailable.
  }
}

module.exports = { tryTrackPolicyChange };
