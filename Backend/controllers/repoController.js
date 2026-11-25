const mongoose = require("mongoose");
const Repository = require("../models/repoModel");
const { s3, S3_BUCKET } = require("../config/aws-config");

// Create repository
async function createRepository(req, res) {
  const { owner, name, issues, content, description, visibility } = req.body;

  try {
    if (!name) {
      return res.status(400).json({ error: "Repository name is required!" });
    }

    if (!mongoose.Types.ObjectId.isValid(owner)) {
      return res.status(400).json({ error: "Invalid User ID!" });
    }

    const newRepository = new Repository({
      name,
      description,
      visibility,
      owner,
      content: content || [],
      issues: issues || [],
    });

    const result = await newRepository.save();

    res.status(201).json({
      message: "Repository created!",
      repositoryID: result._id,
    });
  } catch (err) {
    console.error("Repository creation error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
}

// Get all repositories
async function getAllRepositories(req, res) {
  try {
    const repositories = await Repository.find({})
      .populate("owner")
      .populate("issues");

    res.json(repositories);
  } catch (err) {
    console.error("Fetching error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
}

// Get repository by ID

async function fetchRepositoryById(req, res) {
  const { id } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: "Invalid repository ID!",
      });
    }

    const repository = await Repository.findById(id);

    if (!repository) {
      return res.status(404).json({
        error: "Repository not found!",
      });
    }

    res.status(200).json({
      message: "Repository fetched successfully!",
      repository,
    });
  } catch (err) {
    console.error("Fetching repository error:", err);

    res.status(500).json({
      error: "Server error",
      details: err.message,
    });
  }
}


// Get repository by name
async function fetchRepositoryByName(req, res) {
  const { name } = req.params;

  try {
    const repository = await Repository.find({ name })
      .populate("owner")
      .populate("issues");

    res.json(repository);
  } catch (err) {
    console.error("Fetching repository error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
}

// Get repositories of a user
async function fetchRepositoriesForCurrentUser(req, res) {
  const { userID } = req.params;

  try {
    const repositories = await Repository.find({ owner: userID });

    res.status(200).json({
      message: "Repositories fetched successfully!",
      repositories,
    });
  } catch (err) {
    console.error("Fetching user repositories error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
}

// Update repository
async function updateRepositoryById(req, res) {
  const { id } = req.params;
  const { content, description } = req.body;

  try {
    const repository = await Repository.findById(id);

    if (!repository) {
      return res.status(404).json({ error: "Repository not found!" });
    }

    if (content !== undefined) {
      repository.content.push(content);
    }

    if (description !== undefined) {
      repository.description = description;
    }

    const updatedRepository = await repository.save();

    res.json({
      message: "Repository updated successfully!",
      repository: updatedRepository,
    });
  } catch (err) {
    console.error("Updating repository error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
}

// Toggle repository visibility
async function toggleVisibilityById(req, res) {
  const { id } = req.params;

  try {
    const repository = await Repository.findById(id);

    if (!repository) {
      return res.status(404).json({ error: "Repository not found!" });
    }

    repository.visibility = !repository.visibility;

    await repository.save();

    res.json({
      message: "Repository visibility toggled successfully!",
      repository,
    });
  } catch (err) {
    console.error("Visibility error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
}

// Delete repository
async function deleteRepositoryById(req, res) {
  const { id } = req.params;

  try {
    const repository = await Repository.findByIdAndDelete(id);

    if (!repository) {
      return res.status(404).json({ error: "Repository not found!" });
    }

    res.json({ message: "Repository deleted successfully!" });
  } catch (err) {
    console.error("Deleting repository error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
}

// Get file content from S3
async function getRepositoryFile(req, res) {
  const { id } = req.params;
  const { key } = req.query;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: "Invalid repository ID!",
      });
    }

    if (!key || typeof key !== "string") {
      return res.status(400).json({
        error: "File key is required!",
      });
    }

    const repository = await Repository.findById(id);

    if (!repository) {
      return res.status(404).json({
        error: "Repository not found!",
      });
    }

    // Only allow files belonging to this repository
    const allowedPrefix = `repositories/${id}/commits/`;

    if (
      !key.startsWith(allowedPrefix) ||
      !repository.content.includes(key)
    ) {
      return res.status(403).json({
        error: "File not found in this repository!",
      });
    }

    const file = await s3
      .getObject({
        Bucket: S3_BUCKET,
        Key: key,
      })
      .promise();

    const contentType = file.ContentType || "text/plain";

    res.status(200).json({
      message: "File content fetched successfully!",
      fileName: key.split("/").pop(),
      content: file.Body.toString("utf8"),
      contentType,
    });
  } catch (err) {
    console.error("Get repository file error:", err);

    res.status(500).json({
      error: "Unable to fetch file content!",
      details: err.message,
    });
  }
}

// Push files to repository
async function pushRepository(req, res) {
  const { id } = req.params;
  const { files, commitId, message } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid repository ID!" });
    }

    const repository = await Repository.findById(id);

    if (!repository) {
      return res.status(404).json({ error: "Repository not found!" });
    }
    // Verify repository owner
    console.log("Logged in user ID:", req.userId);
    console.log("Repository owner ID:", repository.owner.toString());

    // Verify repository owner
    if (repository.owner.toString() !== req.userId) {
      return res.status(403).json({
        error: "You are not authorized to push to this repository!",
      });
    }

    if (
      !commitId ||
      !/^[a-zA-Z0-9-]+$/.test(commitId) ||
      !Array.isArray(files) ||
      files.length === 0
    ) {
      return res.status(400).json({
        error: "Valid commitId and files are required!",
      });
    }

    const uploadedFiles = [];

    for (const file of files) {
      if (
        !file.path ||
        typeof file.path !== "string" ||
        typeof file.content !== "string"
      ) {
        return res.status(400).json({
          error: "Each file must contain path and base64 content!",
        });
      }

      // Prevent path traversal and invalid paths
      const normalizedPath = file.path.replace(/\\/g, "/");

      if (
        normalizedPath.startsWith("/") ||
        normalizedPath
          .split("/")
          .some((part) => !part || part === "." || part === "..") ||
        normalizedPath.startsWith(".Git/") ||
        normalizedPath === ".env" ||
        normalizedPath.endsWith("/.env") ||
        normalizedPath.split("/").includes("node_modules")
      ) {
        return res.status(400).json({
          error: `Invalid or excluded file path: ${file.path}`,
        });
      }

      const key = `repositories/${id}/commits/${commitId}/${normalizedPath}`;

      await s3
        .upload({
          Bucket: S3_BUCKET,
          Key: key,
          Body: Buffer.from(file.content, "base64"),
        })
        .promise();

      uploadedFiles.push(key);
    }

    // Save uploaded file paths in MongoDB
    repository.content = [
      ...new Set([...(repository.content || []), ...uploadedFiles]),
    ];

    await repository.save();

    res.status(200).json({
      message: "Repository pushed successfully!",
      repositoryId: id,
      commitId,
      commitMessage: message || "New commit",
      files: uploadedFiles,
    });
  } catch (err) {
    console.error("Push error:", err);
    res.status(500).json({
      error: "Push failed!",
      details: err.message,
    });
  }
}

module.exports = {
  createRepository,
  getAllRepositories,
  fetchRepositoryById,
  fetchRepositoryByName,
  fetchRepositoriesForCurrentUser,
  updateRepositoryById,
  toggleVisibilityById,
  deleteRepositoryById,
  pushRepository,
  getRepositoryFile,
};
