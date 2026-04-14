// @ts-check
"use strict";

const { writeFileSync, mkdirSync } = require("fs");
const { resolve } = require("path");

const ROOT = resolve(__dirname, "..");
const OUTPUT = resolve(ROOT, "public/licenses.json");

/** @typedef {{ licenses: string | string[]; repository?: string; licenseText?: string }} PackageInfo */

/** @param {Record<string, PackageInfo>} packages */
function writeOutput(packages) {
  const entries = Object.entries(packages).map(([nameAtVersion, info]) => {
    // nameAtVersion is e.g. "react@19.2.3" or "@radix-ui/react-avatar@1.1.11"
    const lastAt = nameAtVersion.lastIndexOf("@");
    const name = lastAt > 0 ? nameAtVersion.slice(0, lastAt) : nameAtVersion;
    const version = lastAt > 0 ? nameAtVersion.slice(lastAt + 1) : "";

    return {
      name,
      version,
      license: Array.isArray(info.licenses)
        ? info.licenses.join(", ")
        : info.licenses ?? "Unknown",
      repository: info.repository ?? null,
      licenseText: info.licenseText?.trim() ?? null,
    };
  });

  entries.sort((a, b) => a.name.localeCompare(b.name));

  mkdirSync(resolve(ROOT, "public"), { recursive: true });
  writeFileSync(OUTPUT, JSON.stringify(entries, null, 2), "utf-8");

  console.log(`✔ Generated licenses.json — ${entries.length} packages`);
}

let licenseChecker;
try {
  licenseChecker = require("license-checker-rseidelsohn");
} catch (e) {
  if (/** @type {any} */ (e).code === "MODULE_NOT_FOUND") {
    // devDependencies are not installed (e.g. production-only install).
    // Write an empty manifest so the build does not fail.
    console.warn(
      "⚠ license-checker-rseidelsohn not found — writing empty licenses.json"
    );
    mkdirSync(resolve(ROOT, "public"), { recursive: true });
    writeFileSync(OUTPUT, "[]", "utf-8");
    process.exit(0);
  }
  throw e;
}

licenseChecker.init(
  {
    start: ROOT,
    production: true,
    excludePrivatePackages: true,
  },
  /** @param {Error | null} err @param {Record<string, PackageInfo>} packages */
  (err, packages) => {
    if (err) {
      console.error("License generation failed:", err.message);
      process.exit(1);
    }
    writeOutput(packages);
  }
);
