const axios = require("axios");
const fs = require("fs").promises;
const path = require("path");
const readline = require("readline");
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const http = require("http");
const { Server } = require("socket.io");
const mainRouter = require("./routes/main.router");

const yargs = require("yargs");
const { hideBin } = require("yargs/helpers");

const { initRepo } = require("./controllers/init");
const { addRepo } = require("./controllers/add");
const { commitRepo } = require("./controllers/commit");
const { pushRepo } = require("./controllers/push");
const { pullRepo } = require("./controllers/pull");
const { revertRepo } = require("./controllers/revert");

dotenv.config();

yargs(hideBin(process.argv))
  .command("start", "Starts a new server", {}, startServer)

  .command("login", "Login to GitHub Clone", {}, async () => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const ask = (question) =>
      new Promise((resolve) => rl.question(question, resolve));

    try {
      const email = await ask("Email: ");
      const password = await ask("Password: ");
      rl.close();

      const response = await axios.post("http://localhost:3000/login", {
        email,
        password,
      });

      const repoPath = path.resolve(process.cwd(), ".Git");
      await fs.mkdir(repoPath, { recursive: true });

      await fs.writeFile(path.join(repoPath, "token"), response.data.token, {
        mode: 0o600,
      });

      console.log("Login successful! Token saved.");
    } catch (error) {
      rl.close();
      console.error(
        "Login failed:",
        error.response?.data?.message || error.message,
      );
    }
  })

  .command("init", "Initialise a new repository", {}, initRepo)
  .command(
    "add <file>",
    "Add a file to the repository",
    (yargs) => {
      yargs.positional("file", {
        describe: "File to add to the staging area",
        type: "string",
      });
    },
    (argv) => {
      addRepo(argv.file);
    },
  )
  .command(
    "commit <message>",
    "Commit the staged files",
    (yargs) => {
      yargs.positional("message", {
        describe: "Commit message",
        type: "string",
      });
    },
    (argv) => {
      commitRepo(argv.message);
    },
  )
  .command(
    "remote add <name> <url>",
    "Connect local repository to remote repository",
    (yargs) => {
      yargs
        .positional("name", { type: "string" })
        .positional("url", { type: "string" });
    },
    async (argv) => {
      try {
        const repoPath = path.resolve(process.cwd(), ".Git");
        const configPath = path.join(repoPath, "config.json");

        const config = JSON.parse(await fs.readFile(configPath, "utf8"));

        config.remote = config.remote || {};
        config.remote[argv.name] = { url: argv.url };

        await fs.writeFile(configPath, JSON.stringify(config, null, 2));

        console.log(`Remote '${argv.name}' added successfully!`);
      } catch (err) {
        console.error("Remote add failed:", err.message);
      }
    },
  )
  .command("push", "Push commits to S3", {}, pushRepo)
  .command("pull", "Pull commits from S3", {}, pullRepo)
  .command(
    "revert <commitID>",
    "Revert to a specific commit",
    (yargs) => {
      yargs.positional("commitID", {
        describe: "Comit ID to revert to",
        type: "string",
      });
    },
    (argv) => {
      revertRepo(argv.commitID);
    },
  )
  .demandCommand(1, "You need at least one command")
  .help().argv;

function startServer() {
  const app = express();
  const port = process.env.PORT || 3000;

  app.use(express.json({ limit: "50mb" }));

  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI) {
    console.error("MONGODB_URI is missing in .env file");
    return;
  }

  mongoose
    .connect(mongoURI)
    .then(() => console.log("MongoDB connected successfully!"))
    .catch((err) => {
      console.error("MongoDB Connection Error:", err.message);
    });
  app.use(cors({ origin: "*" }));

  app.use("/", mainRouter);

  let user = "test";
  const httpServer = http.createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    socket.on("joinRoom", (userID) => {
      user = userID;
      console.log("=====");
      console.log(user);
      console.log("=====");
      socket.join(userID);
    });
  });

  const db = mongoose.connection;

  db.once("open", async () => {
    console.log("CRUD operations called");
    // CRUD operations
  });

  httpServer.listen(port, () => {
    console.log(`Server is running on PORT ${port}`);
  });
}
