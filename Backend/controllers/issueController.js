const mongoose = require("mongoose");
const Repository = require("../models/repoModel");
const Issue = require("../models/issueModel");

async function createIssue(req, res) {
  const { title, description } = req.body;
  const { id } = req.params;

  try {
    if (!title || !description) {
      return res.status(400).json({
        error: "Title and description are required!",
      });
    }

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

    const issue = new Issue({
      title: title.trim(),
      description: description.trim(),
      repository: id,
    });

    await issue.save();

    // Add issue reference to repository
    await Repository.findByIdAndUpdate(id, {
      $addToSet: { issues: issue._id },
    });

    return res.status(201).json({
      message: "Issue created successfully!",
      issue,
    });
  } catch (err) {
    console.error("Error creating issue:", err.message);
    return res.status(500).json({
      error: "Server error",
    });
  }
}

async function getAllIssues(req, res) {
  const { id } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: "Invalid repository ID!",
      });
    }

    const issues = await Issue.find({ repository: id })
      .populate("repository");

    return res.status(200).json({
      message: "Issues fetched successfully!",
      issues,
    });
  } catch (err) {
    console.error("Error fetching issues:", err.message);
    return res.status(500).json({
      error: "Server error",
    });
  }
}

async function getIssueById(req, res) {
  const { id } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: "Invalid issue ID!",
      });
    }

    const issue = await Issue.findById(id).populate("repository");

    if (!issue) {
      return res.status(404).json({
        error: "Issue not found!",
      });
    }

    return res.status(200).json(issue);
  } catch (err) {
    console.error("Error fetching issue:", err.message);
    return res.status(500).json({
      error: "Server error",
    });
  }
}

async function updateIssueById(req, res) {
  const { id } = req.params;
  const { title, description, status } = req.body;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: "Invalid issue ID!",
      });
    }

    if (status && !["open", "closed"].includes(status)) {
      return res.status(400).json({
        error: "Invalid issue status!",
      });
    }

    const issue = await Issue.findById(id);

    if (!issue) {
      return res.status(404).json({
        error: "Issue not found!",
      });
    }

    if (title !== undefined) issue.title = title.trim();
    if (description !== undefined) {
      issue.description = description.trim();
    }
    if (status !== undefined) issue.status = status;

    await issue.save();

    return res.status(200).json({
      message: "Issue updated successfully!",
      issue,
    });
  } catch (err) {
    console.error("Error updating issue:", err.message);
    return res.status(500).json({
      error: "Server error",
    });
  }
}

async function deleteIssueById(req, res) {
  const { id } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        error: "Invalid issue ID!",
      });
    }

    const issue = await Issue.findByIdAndDelete(id);

    if (!issue) {
      return res.status(404).json({
        error: "Issue not found!",
      });
    }

    // Remove issue reference from repository
    await Repository.findByIdAndUpdate(issue.repository, {
      $pull: { issues: issue._id },
    });

    return res.status(200).json({
      message: "Issue deleted successfully!",
    });
  } catch (err) {
    console.error("Error deleting issue:", err.message);
    return res.status(500).json({
      error: "Server error",
    });
  }
}

module.exports = {
  createIssue,
  getAllIssues,
  getIssueById,
  updateIssueById,
  deleteIssueById,
};
