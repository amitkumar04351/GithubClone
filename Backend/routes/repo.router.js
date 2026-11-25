const express = require("express");
const repoController = require("../controllers/repoController");
const authenticateToken = require("../middleware/Authmiddleware.js");

const repoRouter = express.Router();

repoRouter.post("/repo/create", repoController.createRepository);

repoRouter.get("/repo/all", repoController.getAllRepositories);

repoRouter.get("/repo/:id", repoController.fetchRepositoryById);

repoRouter.get("/repo/name/:name", repoController.fetchRepositoryByName);

repoRouter.get(
  "/repo/user/:userID",
  repoController.fetchRepositoriesForCurrentUser,
);

repoRouter.put("/repo/update/:id", repoController.updateRepositoryById);

repoRouter.delete("/repo/delete/:id", repoController.deleteRepositoryById);

repoRouter.patch("/repo/toggle/:id", repoController.toggleVisibilityById);

repoRouter.post(
  "/repo/:id/push",
  authenticateToken,
  repoController.pushRepository,
);
repoRouter.get("/repo/:id/file", repoController.getRepositoryFile);
repoRouter.get("/repo/:id", repoController.fetchRepositoryById);
repoRouter.delete("/repo/delete/:id", repoController.deleteRepositoryById);

module.exports = repoRouter;
