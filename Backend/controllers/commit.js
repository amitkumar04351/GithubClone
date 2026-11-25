
const fs = require("fs").promises;
const path = require("path");
const { v4: uuidv4 } = require("uuid");

async function copyFolder(source, destination) {
  const entries = await fs.readdir(source, { withFileTypes: true });

  for (const entry of entries) {
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

async function commitRepo(message) {
  const repoPath = path.resolve(process.cwd(), ".Git");
  const stagedPath = path.join(repoPath, "staging");
  const commitsPath = path.join(repoPath, "commits");

  try {
    const stagedFiles = await fs.readdir(stagedPath);

    if (stagedFiles.length === 0) {
      throw new Error("Staging area is empty. Run add first.");
    }

    const commitID = uuidv4();
    const commitDir = path.join(commitsPath, commitID);

    await fs.mkdir(commitDir, { recursive: true });
    await copyFolder(stagedPath, commitDir);

    await fs.writeFile(
      path.join(commitDir, "commit.json"),
      JSON.stringify(
        {
          message,
          date: new Date().toISOString(),
        },
        null,
        2
      )
    );

    console.log(`Commit ${commitID} created successfully!`);
    console.log(`Message: ${message}`);
  } catch (error) {
    console.error("Error committing files:", error.message);
  }
}

module.exports = { commitRepo };
