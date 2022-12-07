import cookieParser from "cookie-parser";
import Express from "express";
import config from "./config"
import cors from "cors";
import database from "./database";
import morgan from "morgan";
import bodyParser from "body-parser";

const app = Express();

app.use(cookieParser());
app.use(cors())
app.use(bodyParser.json())
app.use(morgan("dev"))

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

app.post('/api/auth', (req, res) => {
  console.log(req.body);
  return res.send({success: true, user: req.body.data})
})

app.listen(config.port, () => {
  console.log(`App started on port ${config.port}`)
})