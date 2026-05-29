import { Request, Response } from "express";
import catchAsync from "@/utils/catchAsync";
import ApiResponse from "@/utils/ApiResponse";
import { StatusCodes } from "http-status-codes";

import { getDashboardService } from "./dashboard.service";

export const getDashboard = catchAsync(async (req: Request, res: Response) => {
  const data = await getDashboardService(req.user);
  return res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(StatusCodes.OK, "Dashboard fetched successfully", data),
    );
});
