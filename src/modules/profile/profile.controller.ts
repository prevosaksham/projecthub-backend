import { Request, Response } from "express";

import catchAsync from "@/utils/catchAsync";

import {
  getProfileService,
  editProfileService,
  changePasswordService,
} from "./profile.service";
import { StatusCodes } from "http-status-codes";
import ApiResponse from "@/utils/ApiResponse";
import ApiError from "@/utils/ApiError";

// GET PROFILE

export const getProfile = catchAsync(async (req: any, res: Response) => {
  const user = await getProfileService(req.user.id);
  if (!user) {
    throw new ApiError(
      StatusCodes.UNAUTHORIZED,
      "Session invalid. Please login again",
    );
  }
  return res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(StatusCodes.OK, "Profile fetched successfully", user),
    );
});

// EDIT PROFILE

export const editProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "authentication required");
  }
  const updatedUser = await editProfileService(userId, req.body);

  return res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(
        StatusCodes.OK,
        "Profile updated successfully",
        updatedUser,
      ),
    );
});

// CHANGE PASSWORD

export const changePassword = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "authentication required");
    }
    await changePasswordService(userId, req.body);
    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(StatusCodes.OK, "Password changed successfully", null),
      );
  },
);
