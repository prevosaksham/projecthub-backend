import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import ApiError from "@/utils/ApiError";

const authMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  console.log("authHeader", authHeader);
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized access"));
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      role: string;
    };
    req.user = {
      id: decoded.id,
      role: decoded.role,
    };

    next();
  } catch {
    return next(
      new ApiError(StatusCodes.UNAUTHORIZED, "Invalid or expired token"),
    );
  }
};

export default authMiddleware;
