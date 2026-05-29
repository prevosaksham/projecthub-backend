import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";
import { StatusCodes } from "http-status-codes";
import ApiError from "@/utils/ApiError";

const errorMiddleware = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  logger.error(err);
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  if (
    typeof err === "object" &&
    err !== null &&
    "name" in err &&
    (err as { name: string }).name === "SequelizeDatabaseError"
  ) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: (err as unknown as { message: string }).message,
    });
  }

  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: "Internal Server Error",
  });
};

export default errorMiddleware;
