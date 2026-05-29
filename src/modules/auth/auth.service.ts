import { prisma } from "@/db/prisma";
import { CreateUserInput, loginUserInput } from "./auth.validation";
import ApiError from "@/utils/ApiError";
import { StatusCodes } from "http-status-codes";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import {
  generateAccessToken,
  generateRefreshToken,
} from "@/common/utils/tokens";

export const createUserService = async (
  data: CreateUserInput,
  addedById: string,
) => {
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email: data.email }, { empId: data.empId }],
    },
  });
  if (existingUser) {
    throw new ApiError(
      StatusCodes.CONFLICT,
      "User with this email or employee id already exists!",
    );
  }
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(data.password, salt);

  const newUser = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role || Role.MANAGER,
      empId: data.empId,
      designation: data.designation,
      mobileNumber: data.mobileNumber,
      addedById: addedById || null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      mobileNumber: true,
      designation: true,
      empId: true,
      isEnabled: true,
      createdAt: true,
      updatedAt: true,
      addedById: true,
    },
  });
  return newUser;
};

export const loginUserService = async (data: loginUserInput) => {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      password: true,
      isEnabled: true,
      isDeleted: true,
    },
  });
  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid email or password");
  }
  if (user.isDeleted) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Account has been deleted");
  }

  if (!user.isEnabled) {
    throw new ApiError(
      StatusCodes.UNAUTHORIZED,
      "Account is disabled. Please contact admin!",
    );
  }
  const isPasswordValid = await bcrypt.compare(data.password, user.password);
  if (!isPasswordValid) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid email or password");
  }
  const accessToken = generateAccessToken({
    id: user.id,
    role: user.role,
  });
  const refreshToken = generateRefreshToken({
    id: user.id,
    role: user.role,
  });
  const { password, ...userWithoutPassword } = user;
  return {
    user: userWithoutPassword,
    accessToken,
    refreshToken,
  };
};
