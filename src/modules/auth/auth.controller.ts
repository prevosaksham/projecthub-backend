import catchAsync from "@/utils/catchAsync";
import { createUserService, loginUserService } from "./auth.service";
import { StatusCodes } from "http-status-codes";
import ApiResponse from "@/utils/ApiResponse";
import { Request, Response } from "express";
import ApiError from "@/utils/ApiError";
export const createUser = catchAsync(async (req: Request, res: Response) => {
  const adminId = req.user?.id;
  if (!adminId) {
    throw new ApiError(
      StatusCodes.UNAUTHORIZED,
      "Admin authentication required",
    );
  }
  const newUser = await createUserService(req.body, adminId);
  return res
    .status(StatusCodes.CREATED)
    .json(
      new ApiResponse(
        StatusCodes.CREATED,
        "User registered successfully",
        newUser,
      ),
    );
});
export const loginUser = catchAsync(async (req: Request, res: Response) => {
  const user = await loginUserService(req.body);
  return res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, "User Login successfully!", user));
});
