import cookieParser from "cookie-parser";
import Express, { Request, Response, NextFunction } from "express";
import config from "./config";
import cors from "cors";
import database from "./database";
import morgan from "morgan";
import bodyParser from "body-parser";
import flash from "express-flash";
import session from "express-session";
import passport from "passport";
import CreateMemoryStore from "memorystore";
import mongoose from "mongoose";
import colors from "colors";
import gameSchema from "./game.schema";
import { APIAdmin, APIGame } from "./Types";
import { Strategy } from "passport-local";

mongoose.set("strictQuery", true);

const gameDb = mongoose.model<APIGame>("Game", gameSchema);

declare module "express-session" {
  interface SessionData {
    user: { email: string };
    loggedin: boolean;
  }
}

declare global {
  namespace Express {
    interface User {
      email: string;
    }
  }
}

const app = Express();

const domain = config.local ? config.localDomain : config.domain;

passport.use(
  new Strategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    function (email, password, done) {
      // console.log(email, password)
      database.findOne(
        { email, password },
        function (err: any, user: APIAdmin) {
          if (err) {
            return done(err);
          }
          if (!user) {
            return done(null, null);
          }
          return done(null, user);
        }
      );
    }
  )
);

app.use(cookieParser());
app.use(
  cors({
    credentials: true,
    origin: `${config.clientDomain}${
      config.clientPort === 80 ? "" : `:${config.clientPort}`
    }`,
  })
);
app.use(bodyParser.json());
app.use(morgan("dev"));

const MemoryStore = CreateMemoryStore(session);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) =>
  done(null, obj as false | { email: string })
);

app.use(
  session({
    secret: config.secret,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 604800000 },
    store: new MemoryStore({
      checkPeriod: 86400000,
    }),
  })
);

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

function checkAuth(req: Request, res: Response, next: NextFunction) {
  if (req.user) return next();
  else return res.send({ success: false, message: "user not logged in" });
}

async function fetchGames() {
  return await gameDb.find({}).clone().exec();
}

app.post(
  "/api/auth",
  passport.authenticate("local", { failureRedirect: "/api/auth/failure" }),
  (req, res) => {
    return res.status(200).send({
      success: true,
      message: "Connexion réussie !",
      user: { email: req.user.email },
    });
  }
);

app.get("/api/auth/failure", (req, res) => {
  return res.status(200).send({
    success: false,
    message: "L'adresse email ou le mot de passe est invalide",
  });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => {
    res.status(200).send({ success: true });
  });
});

app.get("/api/user", (req: Request, res: Response) => {
  if (req.user) res.send({ success: true, user: { email: req.user.email } });
  else res.send({ success: false, message: "User not logged in" });
});

app.get("/api/gameselector", checkAuth, async (req, res) => {
  const games = await fetchGames();
  const sortedGames = games.sort(
    (a, b) =>
      new Date(b.lastUpdateDate).getTime() -
      new Date(a.lastUpdateDate).getTime()
  );
  return res.send({ success: true, games: sortedGames }).status(200);
});

app.post("/api/save/:gameId", checkAuth, async (req, res) => {
  const games = await fetchGames();
  let game = games.filter((e) => e._id === req.params.gameId)[0];
  if (game) {
    game = Object.assign(game, req.body);
    game.save().then(async () => {
      return res.send({
        success: true,
        game,
        games: await fetchGames(),
        message: "Jeu sauvegardé !",
      });
    });
  } else res.send({ success: false, message: "Jeu introuvable" });
});

app.post("/api/delete/:gameId", checkAuth, async (req, res) => {
  const games = await fetchGames();
  let game = games.filter((e) => e._id === req.params.gameId)[0];
  if (game) {
    game.delete();

    return res.send({
      success: true,
      games: await fetchGames(),
      message: "Jeu suprimé !",
    });
  } else res.send({ success: false, message: "Jeu introuvable" });
});

app.listen(config.port, async () => {
  console.log(
    colors.green(
      `✅ App started on port ${config.port} (${domain}${
        config.port === 80 ? "" : `:${config.port}`
      }/)`
    )
  );
  await mongoose.connect(config.mongoDbUri).then(async () => {
    console.log(colors.green("✅ MongoDB connected"));
  });
});

process.on("unhandledRejection", (err) => {
  console.log(err);
});
