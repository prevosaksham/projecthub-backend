import compression from "compression";
import cors from "cors";
import express, { Application, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import path from "path";

import routes from "./routes";
import errorMiddleware from "./middlewares/error.middleware";
import logger from "./utils/logger";
import { StatusCodes } from "http-status-codes";

export const createApp = (): Application => {
  const app = express();

  app.set("trust proxy", 1);
  const stream = {
    write: (message: string) => logger.info(message.trim()),
  };

  app.use(helmet());
  app.use(
    morgan(env.NODE_ENV === "production" ? "combined" : "dev", {
      stream,
    }),
  );
  // app.use(
  //   cors({
  //     origin: env.CORS_ORIGIN.split(",").map((o) => o.trim()),
  //     credentials: true,
  //   }),
  // );

  app.use(
    cors({
      origin: true,
      credentials: true,
    }),
  );
  app.use(compression());
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  app.use(
    "/api",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 300,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  app.get("/health", (req: Request, res: Response) => {
    return res
      .status(StatusCodes.OK)
      .json({ success: true, message: "Server is up and runnig!" });
  });

  app.use("/api/v1", routes);

  app.use(errorMiddleware);

  return app;
};
