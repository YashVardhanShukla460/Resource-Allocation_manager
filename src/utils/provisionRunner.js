const { spawn } = require("child_process");
const path = require("path");

function runProvisionScript(payload) {
  return new Promise((resolve) => {
    const script = process.env.PROVISION_SCRIPT || "./scripts/provision-resources.sh";
    const scriptPath = path.resolve(script);
    const encodedPayload = Buffer.from(JSON.stringify(payload || {}), "utf8").toString("base64");

    const child = spawn("bash", [scriptPath, encodedPayload], { stdio: "inherit" });
    child.on("close", (code) => resolve(code === 0));
    child.on("error", () => resolve(false));
  });
}

module.exports = { runProvisionScript };
