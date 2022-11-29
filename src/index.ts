import Express from "express";
import session from "express-session";
import passport from "passport";
import mongoose from "mongoose";
import { config } from "./config.js";
import colors from "colors";
import adminDb from "./database";
import gameSchema from "./gameSchema";
import morgan from "morgan";
import cors from "cors";
import bodyParser from "body-parser";
import CreateMemoryStore from "memorystore";
import algoliasearch from "algoliasearch";
import flash from "express-flash";
import cookieParser from "cookie-parser";
import { Strategy as LocalStrategy } from "passport-local";
import { APIGame, APIAdmin } from "./Types.js";
import MongoStore from "connect-mongo";
import https from "https";
import fs from "fs";

const app = Express();

let server;

if(config.local) {
  server = app
} else {
  const privateKey = fs.readFileSync("./letsencrypt/privatekey.pem");
  const certificate = fs.readFileSync("./letsencrypt/certificate.pem");
  server = https.createServer(
    {
      key: privateKey,
      cert: certificate,
    },
    app
  );
}

const client = algoliasearch("UYH8GWCR8R", config.algoliaKey);
const index = client.initIndex("Games");

const gameDb = mongoose.model<APIGame>("Game", gameSchema);

async function loadGames() {
  return await gameDb.find({}).clone().exec();
}

(async () => {
  const changeStream = await gameDb.watch([]);

  changeStream.on("change", async () => {
    index
      .replaceAllObjects(await loadGames(), {
        safe: true,
        autoGenerateObjectIDIfNotExist: true,
      })
      .catch((err) => console.error(err));
  });
})();

app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: false,
    cookie: {},
    name: "local",
    store: MongoStore.create({
      mongoUrl: config.mongoDbUri,
    }),
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    adminDb.authenticate()
  )
);
passport.serializeUser(adminDb.serializeUser());
passport.deserializeUser(adminDb.deserializeUser());

app.use(cors());
app.use(bodyParser.json());
app.use(morgan("dev"));

const MemoryStore = CreateMemoryStore(session);

app.use(
  session({
    secret: config.secret,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 604800000 },
  })
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

app.use(flash());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader(
      "Access-Control-Allow-Origin",
      `${config.clientDomain}${
        config.clientPort === 80 ? "" : `:${config.clientPort}`
      }`
    );
    next();
  }
);

const domain = config.local ? config.localDomain : config.domain;

async function fetchGames() {
  return await gameDb.find({}).clone().exec();
}

async function fetchGame(id: string) {
  let game = await gameDb.findById(id).clone();
  if (!game) return null;
  return game;
}

app.get('/', (req, res) => {
  res.writeHead(200)
  res.end("App running !")
})

app.get("/api/games", async (req, res) => {
  const games = await fetchGames();
  //     setTimeout(() => {
  return res.send({ success: true, games }).status(200);
  //     }, 10000);
});

app.get("/api/header/games", async (req, res) => {
  const games = await fetchGames();
  const sortedGames = games.sort(
    (a, b) =>
      new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
  );
  let finalGames = [];
  for (let i = 0; i < 5; i++) {
    const game = sortedGames[i];
    const data = {
      name: game.name,
      _id: game._id,
      releaseDate: game.releaseDate,
    };
    finalGames.push(data);
  }
  // setTimeout(() => {
  return res.send({ success: true, games: finalGames }).status(200);
  // }, 5000)
});

app.get("/api/home/games", async (req, res) => {
  const games = await fetchGames();
  const sortedGames = games.sort(
    (a, b) =>
      new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
  );
  let finalGames = [];
  for (let i = 0; i < 2; i++) {
    const game = sortedGames[i];
    const data = {
      name: game.name,
      _id: game._id,
      coverUrl: game.coverUrl,
    };
    finalGames.push(data);
  }
  // setTimeout(() => {
  return res.send({ success: true, games: finalGames }).status(200);
  // }, 5000)
});

app.get("/api/games/:gameId", async (req, res) => {
  const game = await fetchGame(req.params.gameId);
  return res.send({ success: true, game }).status(200);
});

function checkAuth(
  req: Express.Request,
  res: Express.Response,
  next: Express.NextFunction
) {
  console.log(req.user);
  if (req.user) return next();
  else {
    return res.send({ success: false, message: "user not logged in" });
  }
}

app.post(
  "/api/admin/login",
  passport.authenticate(
    "local",
    { failureRedirect: "/api/admin/login/error" },
    (arg1, arg2, err) => console.log(err)
  ),
  (req, res) => {
    if (!req.body || !req.body.email || !req.body.password)
      return res.send({ success: false, message: "invalid request" });

    let info = {
      email: req.body.email,
      password: req.body.password,
    };

    adminDb
      .findOne(info)
      .clone()
      .then((data) => {
        if (data) {
          // req.session.loggedin = true;
          // req.session.user = data;
          return res.send({
            success: true,
            message: "Connexion réussie !",
            user: { email: data.email },
          });
        } else {
          return res.send({
            success: false,
            message: "L'adresse email ou mot de passe est invalide",
          });
        }
      })
      .catch((err) => console.log(err));
  }
);

app.get("/api/admin/info", checkAuth, (req, res) => {
  res.send({ success: true, user: { email: req.session } });
});

app.get("/api/admin/logout", (req, res) => {
  req.session.destroy((err) => {
    return res.send({ success: false, message: err });
  });
  res.send({ success: true });
});

app.get("/api/admin/gameselector", checkAuth, async (req, res) => {
  const games = await fetchGames();
  const sortedGames = games.sort(
    (a, b) =>
      new Date(b.lastUpdateDate).getTime() -
      new Date(a.lastUpdateDate).getTime()
  );
  let finalGames = [];
  for (const game of sortedGames) {
    const data = {
      name: game.name,
      _id: game.id,
      releaseDate: game.releaseDate,
    };
    finalGames.push(data);
  }
  return res.send({ success: true, games: finalGames }).status(200);
});

// app.listen(80)

server.listen(config.port, null, async () => {
  console.log(
    colors.green(
      `✅ App started on port ${config.port} (${domain}${
        config.port === 80 ? "" : `:${config.port}`
      }/)`
    )
  );
  await mongoose.connect(config.mongoDbUri).then(async () => {
    console.log(colors.green("✅ MongoDB connected"));
    require("./bot.js");
  });
});
