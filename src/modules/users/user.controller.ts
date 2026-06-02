import ApiError from "@/utils/ApiError";
import ApiResponse from "@/utils/ApiResponse";
import catchAsync from "@/utils/catchAsync";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import {
  findAllUsersService,
  findUserByIdService,
  getUserByIdService,
  toggleUserService,
} from "./user.service";
export const findAllUsers = catchAsync(async (req: Request, res: Response) => {
  const addedById = req.user?.id;
  if (!addedById) {
    throw new ApiError(
      StatusCodes.UNAUTHORIZED,
      "Admin authentication required",
    );
  }
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const search = req.query.search as string | undefined;
  const newProject = await findAllUsersService(addedById, page, limit, search);
  return res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(StatusCodes.OK, "users fetched successfully", newProject),
    );
});

export const findUserById = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "authentication required");
  }
  const user = await findUserByIdService(userId);
  return res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, "user fetched successfully", user));
});

export const findUserProjects = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.params?.id;
    if (!userId) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "authentication required");
    }
    const projects = await getUserByIdService(userId);
    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          "user projects fetched successfully",
          projects,
        ),
      );
  },
);
export const toggleUser = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params?.id;
  const { isEnabled } = req.body;
  if (!userId) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User id is required");
  }
  if (typeof isEnabled !== "boolean") {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "isEnabled must be a boolean (true/false)",
    );
  }
  const updatedUser = await toggleUserService(userId, isEnabled);
  const message = isEnabled
    ? "User has been enabled successfully"
    : "User has been disabled successfully";
  return res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, message, updatedUser));
});
