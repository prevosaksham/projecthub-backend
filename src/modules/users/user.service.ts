import { ROLES } from "@/common/utils/roles";
import { prisma } from "@/db/prisma";
import ApiError from "@/utils/ApiError";
import { Prisma, Role } from "@prisma/client";
import { StatusCodes } from "http-status-codes";

export const findAllUsersService = async (
  addedByUser: any,
  page = 1,
  limit = 10,
  search?: string,
  role?: string,
) => {
  const skip = (page - 1) * limit;
  const isSuperAdmin = addedByUser?.role === ROLES.SUPER_ADMIN;

  const whereClause = {
    isDeleted: false,
    ...(isSuperAdmin
      ? {
          role: {
            not: Role.SUPER_ADMIN,
          },
        }
      : { addedById: addedByUser?.id }),
    ...(role && {
      role: role as Role,
    }),
    ...(search && {
      OR: [
        {
          name: {
            contains: search as string,
            mode: Prisma.QueryMode.insensitive,
          },
        },
        {
          email: {
            contains: search as string,
            mode: Prisma.QueryMode.insensitive,
          },
        },
        {
          empId: {
            contains: search as string,
            mode: Prisma.QueryMode.insensitive,
          },
        },
        {
          mobileNumber: {
            contains: search as string,
            mode: Prisma.QueryMode.insensitive,
          },
        },
      ],
    }),
  };
  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        email: true,
        empId: true,
        role: true,
        mobileNumber: true,
        isEnabled: true,
      },
    }),

    prisma.user.count({
      where: whereClause,
    }),
  ]);

  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    users,
  };
};

export const findUserByIdService = async (userId: string) => {
  return prisma.user.findUnique({
    where: {
      id: userId,
      isDeleted: false,
    },
    select: {
      id: true,
      name: true,
      email: true,
      empId: true,
      mobileNumber: true,
    },
  });
};

export const findUserByProjectService = async (userId: string) => {
  return await prisma.user.findFirst({
    where: {
      id: userId,
      isDeleted: false,
      isEnabled: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      empId: true,
      mobileNumber: true,
      createdProjects: {
        take: 20,
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          priority: true,
          clientName: true,
          startDate: true,
          endDate: true,
          devUrl: true,
          prodUrl: true,
          uatUrl: true,
          developers: true,
        },
      },
    },
  });
};
export const getLeadershipUsersService = async () => {
  return prisma.user.findMany({
    where: {
      role: "LEADERSHIP",
      isDeleted: false,
      isEnabled: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      empId: true,
    },
  });
};

export const getUserByIdService = async (userId: string) => {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      isDeleted: false,
      isEnabled: true,
    },

    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      empId: true,
      mobileNumber: true,
      assignedProjects: {
        where: {
          isDeleted: false,
          project: {
            isDeleted: false,
          },
        },

        select: {
          id: true,
          assignedAt: true,
          isEnabled: true,

          project: {
            select: {
              id: true,
              name: true,
              description: true,
              status: true,
              priority: true,
              clientName: true,
              startDate: true,
              endDate: true,
              devUrl: true,
              uatUrl: true,
              prodUrl: true,
              developers: true,

              // ✅ DOCUMENTS ADDED HERE
              documents: {
                where: {
                  isDeleted: false,
                },
                select: {
                  id: true,
                  name: true,
                  url: true,
                  fileType: true,
                  fileSize: true,
                  createdAt: true,
                },
                orderBy: {
                  createdAt: "desc",
                },
              },

              createdBy: {
                select: {
                  id: true,
                  name: true,
                  role: true,
                },
              },
            },
          },
        },

        orderBy: {
          assignedAt: "desc",
        },
      },
    },
  });

  return user;
};

export const toggleUserService = async (userId: string, isEnabled: boolean) => {
  const user = await prisma.user.findFirst({
    where: { id: userId, isDeleted: false },
  });

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      isEnabled,
    },
  });
  const responseData = {
    id: updatedUser.id,
    isEnabled: updatedUser.isEnabled,
  };
  return responseData;
};

// *************************************ROLE DROPDOWN*******************************\

export const getRoleService = async (user: any) => {
  if (user.role === "SUPER_ADMIN") {
    return [
      {
        label: "ADMIN",
        value: "ADMIN",
      },
      {
        label: "MANAGER",
        value: "MANAGER",
      },
      {
        label: "LEADERSHIP",
        value: "LEADERSHIP",
      },
    ];
  } else if (user.role === "ADMIN") {
    return [
      {
        label: "MANAGER",
        value: "MANAGER",
      },
      {
        label: "LEADERSHIP",
        value: "LEADERSHIP",
      },
    ];
  } else {
    return [{}];
  }
};
