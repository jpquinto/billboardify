const fs = require("fs-extra");
const path = require("path");
const archiver = require("archiver");

const layerRoot = path.resolve(__dirname, "build/layers/shared/nodejs");
const zipPath = path.resolve(__dirname, "build/layers/shared_layer.zip");

const packageJsonSrc = path.resolve(__dirname, "package.json");
const localNodeModules = path.resolve(__dirname, "node_modules");
const distSharedSrc = path.resolve(__dirname, "dist/layers/shared/nodejs");

// Packages and patterns to exclude from the layer
const EXCLUDE_PATTERNS = [
  // Development dependencies
  /^@types\//,
  /^typescript$/,
  /eslint/,
  /^@eslint/,
  /jest/,
  /^@jest/,
  /^@babel/,
  /webpack/,
  /rollup/,
  /prettier/,
  /nodemon/,
  /concurrently/,

  // Large development/build tools
  /^esbuild$/,
  /^rollup/,
  /^vite$/,
  /^parcel/,
  /^@rollup/,
  /^@webpack/,
  /^playwright-core/,
  /^playwright-aws-lambda/,
  /^@sparticuz\/chromium/,
  /^chrome-aws-lambda/,
  /^puppeteer-core/,

  // Documentation generators
  /^jsdoc/,
  /^typedoc/,

  // Linting/formatting
  /^@typescript-eslint/,
  /^eslint-/,
  /^@prettier/,

  // Testing utilities (keep only if actually used in Lambda)
  /^mocha$/,
  /^chai$/,
  /^sinon$/,
  /^nyc$/,
  /^c8$/,

  // Large optional dependencies
  /^fsevents$/,
  /^@esbuild/,
  /^@swc/,
];

// Essential packages to always include (even if they match exclude patterns)
const FORCE_INCLUDE = ["aws-sdk", "canvas"];

// File patterns to exclude when copying
const EXCLUDE_FILES = [
  "*.md",
  "*.txt",
  "*.map",
  "*.d.ts",
  "*.spec.js",
  "*.test.js",
  "CHANGELOG*",
  "README*",
  "LICENSE*",
  "LICENCE*",
  "*.log",
  "tsconfig.json",
  ".eslintrc*",
  ".prettierrc*",
  "jest.config.*",
  "webpack.config.*",
  "rollup.config.*",
  "vite.config.*",
];

// Directory patterns to exclude
const EXCLUDE_DIRS = [
  "test",
  "tests",
  "__tests__",
  "spec",
  "specs",
  "docs",
  "documentation",
  "examples",
  "example",
  "coverage",
  ".nyc_output",
  ".git",
  ".github",
  ".vscode",
  "types", // TypeScript types
  "@types",
  "demo",
  "demos",
  "fonts",
  "css",
  "scss",
  "sass",
  "less",
];

function shouldExcludePackage(packageName) {
  // Force include essential packages
  if (FORCE_INCLUDE.some((pkg) => packageName.includes(pkg))) {
    return false;
  }

  return EXCLUDE_PATTERNS.some((pattern) => pattern.test(packageName));
}

function shouldExcludeFile(fileName) {
  return EXCLUDE_FILES.some((pattern) => {
    if (pattern.includes("*")) {
      const regex = new RegExp(pattern.replace(/\*/g, ".*"));
      return regex.test(fileName);
    }
    return fileName === pattern;
  });
}

function shouldExcludeDir(dirName) {
  return EXCLUDE_DIRS.includes(dirName.toLowerCase());
}

async function copyNodeModulesOptimized(src, dest) {
  console.log("📦 Copying and optimizing node_modules...");

  await fs.ensureDir(dest);
  const packages = await fs.readdir(src);
  let excludedCount = 0;
  let includedCount = 0;
  let totalSaved = 0;

  for (const pkg of packages) {
    const srcPath = path.join(src, pkg);
    const destPath = path.join(dest, pkg);
    const stat = await fs.stat(srcPath);

    if (!stat.isDirectory()) continue;

    // Regular AWS SDK - include but optimize
    if (pkg === "aws-sdk") {
      console.log(`✅ Including (optimized): ${pkg}`);
      await copyPackageOptimized(srcPath, destPath);
      includedCount++;
      continue;
    }

    // Handle scoped packages (@org/package)
    if (pkg.startsWith("@")) {
      const destOrgDir = path.join(dest, pkg);
      await fs.ensureDir(destOrgDir);

      const scopedPackages = await fs.readdir(srcPath);
      for (const scopedPkg of scopedPackages) {
        const fullPkgName = `${pkg}/${scopedPkg}`;
        if (shouldExcludePackage(fullPkgName)) {
          console.log(`🗑️  Excluding: ${fullPkgName}`);
          excludedCount++;
          continue;
        }

        const scopedSrcPath = path.join(srcPath, scopedPkg);
        const scopedDestPath = path.join(destOrgDir, scopedPkg);

        await copyPackageOptimized(scopedSrcPath, scopedDestPath);
        includedCount++;
      }
    } else {
      if (shouldExcludePackage(pkg)) {
        console.log(`🗑️  Excluding: ${pkg}`);
        excludedCount++;
        continue;
      }

      await copyPackageOptimized(srcPath, destPath);
      includedCount++;
    }
  }

  console.log(
    `✅ Processed ${includedCount} packages, excluded ${excludedCount} packages`
  );
}

async function copyPackageOptimized(src, dest) {
  await fs.ensureDir(dest);

  const items = await fs.readdir(src);

  for (const item of items) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    const stat = await fs.stat(srcPath);

    if (stat.isDirectory()) {
      if (shouldExcludeDir(item)) {
        continue; // Skip excluded directories
      }
      await copyPackageOptimized(srcPath, destPath);
    } else {
      if (shouldExcludeFile(item)) {
        continue; // Skip excluded files
      }
      await fs.copy(srcPath, destPath);
    }
  }
}

async function getDirectorySize(dirPath) {
  let totalSize = 0;
  const items = await fs.readdir(dirPath);

  for (const item of items) {
    const itemPath = path.join(dirPath, item);
    const stat = await fs.stat(itemPath);

    if (stat.isDirectory()) {
      totalSize += await getDirectorySize(itemPath);
    } else {
      totalSize += stat.size;
    }
  }

  return totalSize;
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

async function buildLayer() {
  console.log("🧹 Cleaning previous build...");
  await fs.remove(layerRoot);
  await fs.remove(zipPath);

  console.log("📁 Creating layer directory...");
  await fs.ensureDir(layerRoot);
  const layerNodeModules = path.join(layerRoot, "node_modules");

  // Copy and optimize node_modules
  await copyNodeModulesOptimized(localNodeModules, layerNodeModules);

  console.log("📄 Copying package.json...");
  await fs.copy(packageJsonSrc, path.join(layerRoot, "package.json"));

  if (await fs.pathExists(distSharedSrc)) {
    console.log("📁 Copying shared compiled files...");
    const files = await fs.readdir(distSharedSrc);
    for (const file of files) {
      const srcPath = path.join(distSharedSrc, file);
      const destPath = path.join(layerRoot, file);
      await fs.copy(srcPath, destPath);
    }
  } else {
    console.warn(`⚠️ No compiled shared files found at: ${distSharedSrc}`);
  }

  // Check layer size before zipping
  const layerSize = await getDirectorySize(layerRoot);
  console.log(`📊 Layer size: ${formatBytes(layerSize)}`);

  if (layerSize > 250 * 1024 * 1024) {
    // 250MB limit
    console.warn(
      `⚠️ Layer is ${formatBytes(layerSize)}, close to 250MB limit!`
    );
  }

  console.log("📦 Creating zip file...");
  const output = fs.createWriteStream(zipPath);
  const archive = archiver("zip", { zlib: { level: 9 } });

  return new Promise((resolve, reject) => {
    output.on("close", () => {
      const zipSize = fs.statSync(zipPath).size;
      console.log(`✅ Layer zip created at: ${zipPath}`);
      console.log(`📊 Zip size: ${formatBytes(zipSize)}`);
      console.log("🎉 Layer build completed successfully!");
      resolve();
    });

    archive.on("error", (err) => {
      console.error("❌ Error creating zip:", err);
      reject(err);
    });

    archive.pipe(output);
    archive.directory(layerRoot, "nodejs");
    archive.finalize();
  });
}

buildLayer().catch((err) => {
  console.error("❌ Error building layer:", err);
  process.exit(1);
});
