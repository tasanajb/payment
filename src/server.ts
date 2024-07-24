import express from "express";
import apiRoutes from "./controllers";
import http from "http";
import dotenv from "dotenv";
import chalk from "chalk";
import { createPool, pool } from "./config";
import helmet from "helmet";
import nocache from "nocache";
import cors from "cors";
import compression from "compression";
import morgan from "morgan";
import { HttpException } from "./models/HttpException";
import { logger } from "./utilities";
import sql from "mssql";
import schedules from "./schedules";
import path from "path";

let started_time: Date;
// ENV
const env_result = dotenv.config();
if (env_result.error) {
  throw env_result.error;
}
const env = env_result.parsed;

declare global {
  namespace Express {
    interface Request {
      client_id: string;
      product_name: string;
    }
  }
}

const app = express();
const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "DELETE", "UPDATE", "PUT", "PATCH"],
};

app.use(helmet());
app.use(nocache());
app.use(cors(corsOptions));
app.disable("x-powered-by");
app.use(helmet.frameguard({ action: "sameorigin" }));
app.use(compression());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.use(apiRoutes);

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.get("/redirect", (req, res) => {
  let url_params: any = req.query.action;
  let redirect_url = decodeURI(url_params);
  console.log("redirect_url ==> ", redirect_url);
  res.render('paymentredirect', { redirectUrl: redirect_url  });
});

app.use("/api/statics", express.static(path.join(__dirname, "../public")));
app.use("/images", express.static("./images/"));

app.use("/script", express.static("./src/views/script/"));

app.use(function (
  err: HttpException,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  console.log(req.body);
  if (res.headersSent) {
    return next(err);
  }

  if (err.status && err.status < 500) {
    logger.info(err.message);
  } else {
    if (err.stack) {
      logger.error(err.stack);
    } else {
      logger.info(err.message);
    }
  }

  res.status(err.status || 500).send({
    error_code: err.status || 500,
    error_message: err.message || "System error, Something went wrong",
  });
});

// Process Setup
if (process.env.NODE_ENV === "production") {
  process.on("uncaughtException", function (er) {
    logger.error(er.stack);
    console.error(chalk.red(er.stack));
    process.exit(1);
  });
}

process.on("SIGINT", function () {
  if (pool) {
    pool.close((err) => {
      console.log(chalk.blueBright.inverse(`Pool release`));
      process.exit(err ? 1 : 0);
    });
  }
});

const configSql: sql.config = {
  server: process.env.DB_HOST as string,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME as string,
  requestTimeout: 30000,
  //connectionTimeout: 50000,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  options: {
    encrypt: false,
    rowCollectionOnDone: true,
    useUTC: false,
    enableArithAbort: true,
  },
};

// Start App
createPool(configSql)
  .then(() => {
    console.log(chalk.green.inverse(`Pool connected`));

    started_time = new Date();
    if (process.env.ENQUIRY_JOB_START === "true") {
      schedules.enquiry.start();
    }
    http.createServer(app).listen(env.PORT, () => {
      console.log(chalk.green.inverse(`Listening on port ${env.PORT}`));
    });

    http.createServer(app).setTimeout(30000);
  })
  .catch((err) => {
    console.log(chalk.red.inverse(`Pool connect error`), err);
  });
