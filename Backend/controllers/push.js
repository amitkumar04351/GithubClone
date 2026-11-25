
const fs = require("fs").promises;
const path = require("path");
const axios = require("axios");

async function collectFiles(directory, baseDirectory = directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name === "commit.json") continue;

    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      const nestedFiles = await collectFiles(fullPath, baseDirectory);
      files.push(...nestedFiles);
    } else if (entry.isFile()) {
      const content = await fs.readFile(fullPath);

      files.push({
        path: path.relative(baseDirectory, fullPath).split(path.sep).join("/"),
        content: content.toString("base64"),
      });
    }
  }

  return files;
}

async function pushRepo() {
  const repoPath = path.resolve(process.cwd(), ".Git");
  const commitsPath = path.join(repoPath, "commits");
  const configPath = path.join(repoPath, "config.json");
  const tokenPath = path.join(repoPath, "token");

  try {
    const config = JSON.parse(await fs.readFile(configPath, "utf8"));
    const remoteUrl = config.remote?.origin?.url;

    if (!remoteUrl) {
      throw new Error("Remote not configured. Run remote add origin first.");
    }

    const token = (await fs.readFile(tokenPath, "utf8")).trim();

    if (!token) {
      throw new Error("Login token missing. Run login first.");
    }

    const commitDirs = await fs.readdir(commitsPath, {
      withFileTypes: true,
    });

    const directories = commitDirs.filter((entry) => entry.isDirectory());

    if (directories.length === 0) {
      throw new Error("No commits found. Run add and commit first.");
    }

    for (const entry of directories) {
      const commitId = entry.name;
      const commitPath = path.join(commitsPath, commitId);

      const files = await collectFiles(commitPath);

      if (files.length === 0) continue;

      let message = "New commit";

      try {
        const metadata = JSON.parse(
          await fs.readFile(path.join(commitPath, "commit.json"), "utf8")
        );
        message = metadata.message || message;
      } catch (_) {}

      const response = await axios.post(
        remoteUrl.replace(/\/+$/, "") + "/push",
        {
          commitId,
          message,
          files,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log(response.data.message);
    }

    console.log("All commits pushed successfully!");
  } catch (error) {
    console.error(
      "Push failed:",
      error.response?.data || error.message
    );
  }
}

module.exports = { pushRepo };
