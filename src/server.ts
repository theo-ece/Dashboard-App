import express = require("express");
import { MetricsHandler } from "./metrics";
import path = require("path");
import fs = require("fs");
import bodyparser = require("body-parser");

const app = express();
const port: string = process.env.PORT || "8080";
app.use(express.static(path.join(__dirname, "/../public")));
app.use(bodyparser.json());
app.use(bodyparser.urlencoded());

app.set("views", __dirname + "/../views");
app.set("view engine", "ejs");

const dbDir: string = "./db";
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir);

/* Sessions */

import session = require("express-session");
import levelSession = require("level-session-store");

const LevelStore = levelSession(session);

app.use(
  session({
    secret: "my very secret phrase",
    store: new LevelStore("./db/sessions"),
    resave: true,
    saveUninitialized: true
  })
);

/* Users Auth */

import { UserHandler, User } from "./users";
const dbUser: UserHandler = new UserHandler(dbDir + "/users");
const authRouter = express.Router();

authRouter.get("/login", (req: any, res: any) => {
  res.render("login");
});

authRouter.get("/signup", (req: any, res: any) => {
  res.render("signup");
});

authRouter.get("/logout", (req: any, res: any) => {
  delete req.session.loggedIn;
  delete req.session.user;
  res.redirect("/login");
});

authRouter.post("/login", (req: any, res: any, next: any) => {
  dbUser.get(req.body.username, (err: Error | null, result?: User) => {
    if (err) next(err);
    if (result === undefined || !result.validatePassword(req.body.password)) {
      res.redirect("/login");
    } else {
      req.session.loggedIn = true;
      req.session.user = result;
      res.redirect("/");
    }
  });
});

app.use(authRouter);

/* Users CRUD */

const userRouter = express.Router();

userRouter.post("/", (req: any, res: any, next: any) => {
  dbUser.get(req.body.username, function(err: Error | null, result?: User) {
    if (!err || result !== undefined) {
      res.status(409).send("user already exists");
    } else {
      let user = new User(req.body.username, req.body.email, req.body.password);
      dbUser.save(user, function(err: Error | null) {
        if (err) next(err);
        else res.status(201).send("user persisted");
      });
    }
  });
});

userRouter.get("/:username", (req: any, res: any, next: any) => {
  dbUser.get(req.params.username, function(err: Error | null, result?: User) {
    if (err || result === undefined) {
      res.status(404).send("user not found");
    } else res.status(200).json(result);
  });
});

app.use("/user", userRouter);

/* Metrics */
const dbMet: MetricsHandler = new MetricsHandler(dbDir + "/metrics");

app.get("/hello/:name", (req: any, res: any) => {
  res.render("hello.ejs", { name: req.params.name });
});

app.get("/metrics/:id", (req: any, res: any) => {
  dbMet.get(req.params.id, (err: Error | null, result?: any) => {
    if (err) throw err;
    res.json(result);
  });
});

app.post("/metrics/:id", (req: any, res: any) => {
  dbMet.save(req.params.id, req.body, (err: Error | null) => {
    if (err) throw err;
    res.status(200).send();
  });
});

/* Start server */

const authCheck = function(req: any, res: any, next: any) {
  if (req.session.loggedIn) {
    next();
  } else res.redirect("/login");
};

app.get("/", authCheck, (req: any, res: any) => {
  res.render("index", { name: req.session.user.username });
});

app.listen(port, (err: Error) => {
  if (err) throw err;
  console.log(`Server is running on http://localhost:${port}`);
});
