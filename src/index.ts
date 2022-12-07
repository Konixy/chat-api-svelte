import cookieParser from "cookie-parser";
import Express, {Request, Response, NextFunction} from "express";
import config from "./config"
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

declare module 'express-session' {
  interface SessionData {
    user: {email: string};
    loggedin: boolean
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


app.use(cookieParser());
app.use(cors())
app.use(bodyParser.json())
app.use(morgan("dev"))

const MemoryStore = CreateMemoryStore(session)

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj as false | {email: string}));

app.use(session({
  secret: config.secret,
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 604800000 }
}))

app.use(flash());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Origin",
    `${config.clientDomain}${
      config.clientPort === 80 ? "" : `:${config.clientPort}`
    }`
  );
  next();
})

app.post('/api/auth', (req: Request<any, any, {email: string, password: string}>, res: Response) => {
  console.log(req.body)
  const email = req.body.email;
  const password = req.body.password;

  database.findOne({email,password}).clone().then(data => {
    if(data) {
      const user = {email: data.email}
      req.logIn(user, () => {
        return res.status(200).send(JSON.stringify({success: true, message:"Connexion réussie !", user }))
      });
    } else {
      return res.status(200).send(JSON.stringify({success: false, message:"L'adresse email ou le mot de passe est invalide"}))
    }
  }).catch(err => console.log(err))
})

app.get('/api/user', (req: Request, res: Response) => {
  console.log(req.user)
  if(req.user) res.send({success: true, user: {email: req.user.email}})
  else res.send({success: false, message: "User not logged in"})
})

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
})