// @ts-check
"use strict";

const { writeFileSync, mkdirSync } = require("node:fs");
const { resolve } = require("node:path");

const ROOT = resolve(__dirname, "..");
const OUTPUT = resolve(ROOT, "public/licenses.json");

/** @typedef {{ licenses: string | string[]; repository?: string; licenseText?: string }} PackageInfo */
/** @typedef {{ name: string; version: string; license: string; repository: string | null; licenseUrl: string | null; licenseText: string | null }} LicenseEntry */

/** @param {Record<string, PackageInfo>} packages */
function buildPackageEntries(packages) {
  return Object.entries(packages).map(([nameAtVersion, info]) => {
    // nameAtVersion is e.g. "react@19.2.3" or "@radix-ui/react-avatar@1.1.11"
    const lastAt = nameAtVersion.lastIndexOf("@");
    const name = lastAt > 0 ? nameAtVersion.slice(0, lastAt) : nameAtVersion;
    const version = lastAt > 0 ? nameAtVersion.slice(lastAt + 1) : "";

    return {
      name,
      version,
      license: Array.isArray(info.licenses)
        ? info.licenses.join(", ")
        : (info.licenses ?? "Unknown"),
      repository: info.repository ?? null,
      licenseUrl: null,
      licenseText: info.licenseText?.trim() ?? null,
    };
  });
}

/** @param {Record<string, PackageInfo>} packages */
function writeOutput(packages) {
  /** @type {LicenseEntry[]} */
  const entries = buildPackageEntries(packages);

  entries.sort((a, b) => a.name.localeCompare(b.name));

  mkdirSync(resolve(ROOT, "public"), { recursive: true });
  writeFileSync(OUTPUT, JSON.stringify(entries, null, 2), "utf-8");

  console.log(`✔ Generated licenses.json — ${entries.length} entries`);
}

let licenseChecker;
try {
  licenseChecker = require("license-checker-rseidelsohn");
} catch (e) {
  if (/** @type {any} */ (e).code === "MODULE_NOT_FOUND") {
    // devDependencies are not installed (e.g. production-only install).
    // Write an empty manifest so the build does not fail.
    console.warn("⚠ license-checker-rseidelsohn not found — writing an empty manifest");
    writeOutput({});
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
  },
);
