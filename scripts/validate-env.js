// scripts/validate-env.js
const { validateEnvironment } = require("./lib/env");

const result = validateEnvironment();

if (result.valid) {
  console.log("✅ Environment configuration is valid!");
  console.log("Configuration:", result);
} else {
  console.error("❌ Environment validation failed:");
  result.errors.forEach((error) => console.error("  -", error));
  process.exit(1);
}
