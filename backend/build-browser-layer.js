const fs = require("fs-extra");
const path = require("path");
const archiver = require("archiver");

// --- Configuration ---
// Define the output paths for the layer and the zip file
const layerRoot = path.resolve(__dirname, "build/layers/browser/nodejs");
const zipPath = path.resolve(__dirname, "build/layers/browser_layer.zip");

// Define the specific packages to include in the layer
const localNodeModules = path.resolve(__dirname, "node_modules");
const TARGET_PACKAGES = ["playwright-core", "puppeteer-core"];

// --- Helper Functions ---
function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
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

// --- Main Build Function ---
async function buildBrowserLayer() {
  console.log("🧹 Cleaning previous build...");
  await fs.remove(layerRoot);
  await fs.remove(zipPath);

  console.log("📁 Creating layer directory...");
  await fs.ensureDir(layerRoot);

  const layerNodeModules = path.join(layerRoot, "node_modules");
  console.log("📁 Creating node_modules directory within the layer...");
  await fs.ensureDir(layerNodeModules);

  console.log("📦 Copying required browser packages...");
  for (const packageName of TARGET_PACKAGES) {
    const src = path.join(localNodeModules, packageName);
    const dest = path.join(layerNodeModules, packageName);

    try {
      if (await fs.pathExists(src)) {
        await fs.copy(src, dest);
        console.log(`✅ Copied: ${packageName}`);
      } else {
        console.error(`❌ Error: Package not found at ${src}`);
      }
    } catch (error) {
      console.error(`❌ Error copying ${packageName}:`, error);
      throw error;
    }
  }

  // Check layer size before zipping
  const layerSize = await getDirectorySize(layerRoot);
  console.log(`📊 Layer size: ${formatBytes(layerSize)}`);

  if (layerSize > 250 * 1024 * 1024) {
    console.warn(
      `⚠️ Warning: Layer size is ${formatBytes(
        layerSize
      )}, which exceeds the 250MB unzipped Lambda layer limit.`
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
    // The Lambda runtime requires the package content to be in a directory named `nodejs` at the root of the zip.
    // By archiving `layerRoot` with the `nodejs` prefix, we ensure this structure.
    archive.directory(layerRoot, "nodejs");
    archive.finalize();
  });
}

buildBrowserLayer().catch((err) => {
  console.error("❌ Error building layer:", err);
  process.exit(1);
});
