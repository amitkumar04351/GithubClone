const express = require("express");
const issueController = require("../controllers/issueController");

const issueRouter = express.Router();

// Create issue for a repository
issueRouter.post("/issue/create/:id", issueController.createIssue);

// Get all issues of a repository
issueRouter.get("/issue/all/:id", issueController.getAllIssues);

// Get single issue
issueRouter.get("/issue/:id", issueController.getIssueById);

// Update issue
issueRouter.put("/issue/update/:id", issueController.updateIssueById);

// Delete issue
issueRouter.delete("/issue/delete/:id", issueController.deleteIssueById);

module.exports = issueRouter;
