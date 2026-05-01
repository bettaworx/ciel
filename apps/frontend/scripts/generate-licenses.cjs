// @ts-check
"use strict";

const { readFileSync, readdirSync, writeFileSync, mkdirSync } = require("fs");
const { extname, join, resolve } = require("path");

const ROOT = resolve(__dirname, "..");
const OUTPUT = resolve(ROOT, "public/licenses.json");
const GOOGLE_FONT_METADATA_PATH = resolve(
  ROOT,
  "node_modules/next/dist/compiled/@next/font/dist/google/font-data.json"
);
const GOOGLE_FONTS_REPO_BASE = "https://github.com/google/fonts/tree/main/ofl";
const GOOGLE_FONTS_RAW_BASE =
  "https://raw.githubusercontent.com/google/fonts/main/ofl";
const SOURCE_EXTENSIONS = new Set([".js", ".jsx", ".ts", ".tsx"]);
const SKIP_DIRS = new Set([
  ".git",
  ".next",
  "node_modules",
  "public",
  "storybook-static",
]);

/** @typedef {{ licenses: string | string[]; repository?: string; licenseText?: string }} PackageInfo */
/** @typedef {{ weights?: string[]; styles?: string[]; subsets?: string[]; display?: string; preload?: boolean; availableWeights?: string[]; availableStyles?: string[]; availableSubsets?: string[] }} FontSpec */
/** @typedef {{ name: string; version: string; license: string; repository: string | null; licenseUrl: string | null; licenseText: string | null; source?: string; font?: FontSpec }} LicenseEntry */

/** @returns {Record<string, { weights?: string[]; styles?: string[]; subsets?: string[] }>} */
function readGoogleFontMetadata() {
  try {
    return JSON.parse(readFileSync(GOOGLE_FONT_METADATA_PATH, "utf-8"));
  } catch (e) {
    console.warn(
      `⚠ Could not read Next.js Google Fonts metadata: ${
        /** @type {Error} */ (e).message
      }`
    );
    return {};
  }
}

/** @param {string} fontFamily */
function getGoogleFontSlug(fontFamily) {
  return fontFamily.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** @param {string} root */
function collectSourceFiles(root) {
  /** @type {string[]} */
  const files = [];

  /** @param {string} dir */
  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) walk(path);
      } else if (entry.isFile() && SOURCE_EXTENSIONS.has(extname(entry.name))) {
        files.push(path);
      }
    }
  }

  walk(root);
  return files;
}

/**
 * @param {FontSpec | undefined} spec
 * @param {{ weights?: string[]; styles?: string[]; subsets?: string[] }} metadata
 * @returns {Required<Pick<FontSpec, "weights" | "styles" | "subsets">> & Pick<FontSpec, "display" | "preload" | "availableWeights" | "availableStyles" | "availableSubsets">}
 */
function normalizeFontSpec(spec, metadata) {
  const availableWeights = metadata.weights ?? [];
  const availableStyles = metadata.styles ?? [];
  const availableSubsets = metadata.subsets ?? [];
  const weights =
    spec?.weights && spec.weights.length > 0
      ? spec.weights
      : availableWeights.includes("variable")
        ? ["variable"]
        : [];
  const styles =
    spec?.styles && spec.styles.length > 0
      ? spec.styles
      : availableStyles.length === 1
        ? [availableStyles[0]]
        : ["normal"];

  return {
    weights,
    styles,
    subsets: spec?.subsets ?? [],
    display: spec?.display ?? "swap",
    preload: spec?.preload ?? availableSubsets.length > 0,
    availableWeights,
    availableStyles,
    availableSubsets,
  };
}

/**
 * @param {FontSpec} current
 * @param {FontSpec} next
 * @returns {FontSpec}
 */
function mergeFontSpecs(current, next) {
  const mergeArray = (a = [], b = []) => [...new Set([...a, ...b])];

  return {
    weights: mergeArray(current.weights, next.weights),
    styles: mergeArray(current.styles, next.styles),
    subsets: mergeArray(current.subsets, next.subsets),
    display:
      current.display === next.display || !next.display
        ? current.display
        : "multiple",
    preload:
      current.preload === next.preload || next.preload === undefined
        ? current.preload
        : undefined,
    availableWeights: mergeArray(current.availableWeights, next.availableWeights),
    availableStyles: mergeArray(current.availableStyles, next.availableStyles),
    availableSubsets: mergeArray(current.availableSubsets, next.availableSubsets),
  };
}

/**
 * @param {unknown} ts
 * @param {unknown} node
 * @param {string} propertyName
 */
function getObjectProperty(ts, node, propertyName) {
  if (!ts || !/** @type {any} */ (ts).isObjectLiteralExpression(node)) {
    return undefined;
  }

  return /** @type {any} */ (node).properties.find((property) => {
    if (!/** @type {any} */ (ts).isPropertyAssignment(property)) return false;
    const name = property.name;
    return (
      (/** @type {any} */ (ts).isIdentifier(name) && name.text === propertyName) ||
      (/** @type {any} */ (ts).isStringLiteral(name) && name.text === propertyName)
    );
  })?.initializer;
}

/**
 * @param {unknown} ts
 * @param {unknown} value
 * @returns {string[] | undefined}
 */
function readStringArrayOption(ts, value) {
  if (!value) return undefined;
  if (/** @type {any} */ (ts).isStringLiteral(value)) {
    return [/** @type {{ text: string }} */ (value).text];
  }
  if (!/** @type {any} */ (ts).isArrayLiteralExpression(value)) {
    return undefined;
  }
  const values = /** @type {{ elements: unknown[] }} */ (value).elements
    .map((element) =>
      /** @type {any} */ (ts).isStringLiteral(element)
        ? /** @type {{ text: string }} */ (element).text
        : null
    )
    .filter((element) => element !== null);
  return /** @type {string[]} */ (values);
}

/**
 * @param {unknown} ts
 * @param {unknown} value
 * @returns {string | undefined}
 */
function readStringOption(ts, value) {
  if (!value || !/** @type {any} */ (ts).isStringLiteral(value)) {
    return undefined;
  }
  return /** @type {{ text: string }} */ (value).text;
}

/**
 * @param {unknown} ts
 * @param {unknown} value
 * @returns {boolean | undefined}
 */
function readBooleanOption(ts, value) {
  if (!value) return undefined;
  if (
    /** @type {any} */ (value).kind ===
    /** @type {any} */ (ts).SyntaxKind.TrueKeyword
  ) {
    return true;
  }
  if (
    /** @type {any} */ (value).kind ===
    /** @type {any} */ (ts).SyntaxKind.FalseKeyword
  ) {
    return false;
  }
  return undefined;
}

/**
 * @param {unknown} ts
 * @param {unknown} callArgument
 * @returns {FontSpec}
 */
function readFontOptions(ts, callArgument) {
  const weight = getObjectProperty(ts, callArgument, "weight");
  const style = getObjectProperty(ts, callArgument, "style");
  const subsets = getObjectProperty(ts, callArgument, "subsets");
  const display = getObjectProperty(ts, callArgument, "display");
  const preload = getObjectProperty(ts, callArgument, "preload");

  return {
    weights: readStringArrayOption(ts, weight),
    styles: readStringArrayOption(ts, style),
    subsets: readStringArrayOption(ts, subsets),
    display: readStringOption(ts, display),
    preload: readBooleanOption(ts, preload),
  };
}

/**
 * @param {string} filePath
 * @param {unknown} ts
 * @returns {Array<{ functionName: string; spec: FontSpec }>}
 */
function detectGoogleFontsWithTypescript(filePath, ts) {
  const sourceText = readFileSync(filePath, "utf-8");
  const sourceFile = /** @type {any} */ (ts).createSourceFile(
    filePath,
    sourceText,
    /** @type {any} */ (ts).ScriptTarget.Latest,
    true
  );
  /** @type {Map<string, string>} */
  const importNamesByLocalName = new Map();
  /** @type {Array<{ functionName: string; spec: FontSpec }>} */
  const calls = [];

  /** @param {any} node */
  function visitImports(node) {
    if (
      /** @type {any} */ (ts).isImportDeclaration(node) &&
      /** @type {any} */ (ts).isStringLiteral(node.moduleSpecifier) &&
      node.moduleSpecifier.text === "next/font/google" &&
      node.importClause?.namedBindings &&
      /** @type {any} */ (ts).isNamedImports(node.importClause.namedBindings)
    ) {
      for (const element of node.importClause.namedBindings.elements) {
        importNamesByLocalName.set(
          element.name.text,
          element.propertyName?.text ?? element.name.text
        );
      }
    }
    /** @type {any} */ (ts).forEachChild(node, visitImports);
  }

  /** @param {any} node */
  function visitCalls(node) {
    if (
      /** @type {any} */ (ts).isCallExpression(node) &&
      /** @type {any} */ (ts).isIdentifier(node.expression)
    ) {
      const functionName = importNamesByLocalName.get(node.expression.text);
      if (functionName) {
        calls.push({
          functionName,
          spec: readFontOptions(ts, node.arguments[0]),
        });
      }
    }
    /** @type {any} */ (ts).forEachChild(node, visitCalls);
  }

  visitImports(sourceFile);
  if (importNamesByLocalName.size > 0) visitCalls(sourceFile);
  return calls;
}

/**
 * Regex fallback for environments without TypeScript. It supports direct named
 * imports and aliases, but intentionally does not try to fully parse JS syntax.
 *
 * @param {string} filePath
 * @returns {Array<{ functionName: string; spec: FontSpec }>}
 */
function detectGoogleFontsWithRegex(filePath) {
  const sourceText = readFileSync(filePath, "utf-8");
  const importMatch = sourceText.match(
    /import\s*\{([\s\S]*?)\}\s*from\s*["']next\/font\/google["']/m
  );
  if (!importMatch) return [];

  /** @type {Map<string, string>} */
  const importNamesByLocalName = new Map();
  for (const part of importMatch[1].split(",")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const aliasMatch = trimmed.match(/^(\w+)\s+as\s+(\w+)$/);
    if (aliasMatch) {
      importNamesByLocalName.set(aliasMatch[2], aliasMatch[1]);
    } else {
      importNamesByLocalName.set(trimmed, trimmed);
    }
  }

  return [...importNamesByLocalName]
    .filter(([localName]) => new RegExp(`\\b${localName}\\s*\\(`).test(sourceText))
    .map(([, functionName]) => ({ functionName, spec: {} }));
}

/** @returns {LicenseEntry[]} */
function collectGoogleFontLicenseEntries() {
  const metadata = readGoogleFontMetadata();
  let ts = null;
  try {
    ts = require("typescript");
  } catch {
    console.warn("⚠ typescript not found — using regex Google Font detection");
  }

  /** @type {Map<string, FontSpec>} */
  const specsByFamily = new Map();

  for (const filePath of collectSourceFiles(ROOT)) {
    const calls = ts
      ? detectGoogleFontsWithTypescript(filePath, ts)
      : detectGoogleFontsWithRegex(filePath);

    for (const call of calls) {
      const fontFamily = call.functionName.replace(/_/g, " ");
      const fontMetadata = metadata[fontFamily];
      if (!fontMetadata) {
        throw new Error(
          `Unknown next/font/google family "${fontFamily}" in ${filePath}`
        );
      }
      const spec = normalizeFontSpec(call.spec, fontMetadata);
      const current = specsByFamily.get(fontFamily);
      specsByFamily.set(
        fontFamily,
        current ? mergeFontSpecs(current, spec) : spec
      );
    }
  }

  return [...specsByFamily.entries()].map(([fontFamily, spec]) => {
    const slug = getGoogleFontSlug(fontFamily);
    return {
      name: fontFamily,
      version: "",
      license: "OFL-1.1",
      repository: `${GOOGLE_FONTS_REPO_BASE}/${slug}`,
      licenseUrl: `${GOOGLE_FONTS_RAW_BASE}/${slug}/OFL.txt`,
      licenseText: null,
      source: "next/font/google",
      font: spec,
    };
  });
}

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
        : info.licenses ?? "Unknown",
      repository: info.repository ?? null,
      licenseUrl: null,
      licenseText: info.licenseText?.trim() ?? null,
    };
  });
}

/** @param {Record<string, PackageInfo>} packages */
function writeOutput(packages) {
  /** @type {LicenseEntry[]} */
  const entries = [
    ...buildPackageEntries(packages),
    ...collectGoogleFontLicenseEntries(),
  ];

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
    // Write font licenses only so the build does not fail.
    console.warn(
      "⚠ license-checker-rseidelsohn not found — writing font licenses only"
    );
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
  }
);
