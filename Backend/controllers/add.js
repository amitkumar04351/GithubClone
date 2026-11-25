
const fs = require("fs").promises;
const path = require("path");

const IGNORED = new Set([
  ".git",
  ".Git",
  "node_modules",
  "dist",
  "build",
  "coverage",
  ".DS_Store",
]);

function shouldIgnore(name) {
  return (
    IGNORED.has(name) ||
    name === ".env" ||
    name.startsWith(".env.")
  );
}

async function copyFolder(source, destination) {
  const entries = await fs.readdir(source, { withFileTypes: true });

  for (const entry of entries) {
    if (shouldIgnore(entry.name)) continue;

    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);

    if (entry.isDirectory()) {
      await fs.mkdir(destinationPath, { recursive: true });
      await copyFolder(sourcePath, destinationPath);
    } else if (entry.isFile()) {
      await fs.mkdir(path.dirname(destinationPath), { recursive: true });
      await fs.copyFile(sourcePath, destinationPath);
    }
  }
}

async function addRepo(filePath) {
  const repoPath = path.resolve(process.cwd(), ".Git");
  const stagingPath = path.join(repoPath, "staging");
  const sourcePath = path.resolve(process.cwd(), filePath);

  try {
    await fs.access(sourcePath);

    // Prevent adding the custom repository's own metadata.
    if (
      sourcePath === repoPath ||
      sourcePath.startsWith(repoPath + path.sep)
    ) {
      throw new Error("Cannot add the .Git repository metadata folder.");
    }

    // Start with a clean staging area.
    await fs.rm(stagingPath, { recursive: true, force: true });
    await fs.mkdir(stagingPath, { recursive: true });

    const stats = await fs.stat(sourcePath);

    if (stats.isDirectory()) {
      await copyFolder(sourcePath, stagingPath);
    } else {
      if (shouldIgnore(path.basename(sourcePath))) {
        throw new Error("This file is excluded from staging.");
      }

      await fs.copyFile(
        sourcePath,
        path.join(stagingPath, path.basename(sourcePath))
      );
    }

    console.log("Files added to staging area successfully!");
  } catch (error) {
    console.error("Error adding files:", error.message);
  }
}

module.exports = { addRepo };
