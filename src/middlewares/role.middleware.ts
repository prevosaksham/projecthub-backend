import { Request, Response, NextFunction } from "express";

import { StatusCodes } from "http-status-codes";

import ApiError from "../utils/ApiError";

const authorize = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(
        new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized access"),
      );
    }
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(StatusCodes.FORBIDDEN, "Forbidden access"));
    }
    next();
  };
};

export default authorize;
