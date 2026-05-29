import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import { prisma } from "@/db/prisma";
import ApiError from "@/utils/ApiError";
import { ChangePasswordInput, EditProfileInput } from "./profile.validation";

// GET PROFILE

export const getProfileService = async (userId: string) => {
  return prisma.user.findUnique({
    where: {
      id: userId,
    },

    select: {
      id: true,
      name: true,
      email: true,
      empId: true,
      mobileNumber: true,
      designation: true,
      role: true,
    },
  });
};

// EDIT PROFILE

export const editProfileService = async (
  userId: string,
  payload: EditProfileInput,
) => {
  return prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      ...payload,
    },
    select: {
      id: true,
      name: true,
      email: true,
      empId: true,
      mobileNumber: true,
      designation: true,
      role: true,
      isEnabled: true,
    },
  });
};

// CHANGE PASSWORD

export const changePasswordService = async (
  userId: string,
  payload: ChangePasswordInput,
) => {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      isDeleted: false,
    },

    select: {
      password: true,
    },
  });

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  if (!user.password) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Password is not set for this account",
    );
  }

  const isMatch = await bcrypt.compare(payload.oldPassword, user.password);

  if (!isMatch) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Old password incorrect");
  }
  if (payload.oldPassword === payload.newPassword) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "New password must be different from current password",
    );
  }
  const hashedPassword = await bcrypt.hash(payload.newPassword, 10);

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      password: hashedPassword,
    },
  });

  return true;
};
