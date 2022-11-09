const app = require("express")();
const session = require("express-session");
const passport = require("passport");
const mongoose = require("mongoose");
const config = require("./config.js");
const colors = require("colors");
const adminSchema = require("./adminSchema.js");
const gameSchema = require("./gameSchema.js");
const morgan = require("morgan");
const cors = require("cors");
const bodyParser = require("body-parser");
const CreateMemoryStore = require("memorystore");
const algoliasearch = require("algoliasearch");

const client = algoliasearch("UYH8GWCR8R", config.algoliaKey);
const index = client.initIndex("Games");

const adminDb = mongoose.model("Admin", adminSchema);
const gameDb = mongoose.model("Game", gameSchema);

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

app.use((req, res, next) => {
  res.setHeader(
    "Access-Control-Allow-Origin",
    `${config.clientDomain}${
      config.clientPort === 80 ? "" : `:${config.clientPort}`
    }`
  );
  next();
});

const domain = config.local ? config.localDomain : config.domain;

async function fetchGames() {
  return await gameDb.find({}).clone().exec();
}

async function fetchGame(id) {
  let game = await gameDb.findById(id).clone();
  if (!game) return null;
  return game;
}

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
      _id: game.id,
      releaseDate: game.releaseDate,
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

function checkAuth(req, res, next) {
  if (req.session.loggedin) return next();
  else {
    return res.send({ success: false, message: "user not logged in" });
  }
}

app.post("/api/admin/login", (req, res) => {
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
        req.session.loggedin = true;
        req.session.user = data;
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
});

app.get("/api/admin/logout", (req, res) => {
  req.session.destroy();
  res.send({ success: true });
});

app.get("/api/admin/gameselector", checkAuth, async (req, res) => {
  const games = await fetchGames();
  const sortedGames = games.sort(
    (a, b) =>
      new Date(b.lastUpdateDate).getTime() - new Date(a.lastUpdateDate).getTime()
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

app.listen(config.port, null, async () => {
  console.log(
    `✅ App started on port ${config.port} (${domain}${
      config.port === 80 ? "" : `:${config.port}`
    }/)`.green
  );
  await mongoose
    .connect(config.mongoDbUri, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    })
    .then(async () => {
      console.log("✅ MongoDB connected".green);
      require("./bot.js");
    });
});
