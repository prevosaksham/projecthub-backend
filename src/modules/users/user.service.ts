import { prisma } from "@/db/prisma";
import ApiError from "@/utils/ApiError";
import { StatusCodes } from "http-status-codes";

export const findAllUsersService = async (
  id: string,
  page = 1,
  limit = 10,
  search?: string,
) => {
  const skip = (page - 1) * limit;

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where: {
        addedById: id,
        isDeleted: false,
        ...(search && {
          OR: [
            { name: { contains: search as string, mode: "insensitive" } },
            { email: { contains: search as string, mode: "insensitive" } },
            { empId: { contains: search as string, mode: "insensitive" } },
            {
              mobileNumber: { contains: search as string, mode: "insensitive" },
            },
            {
              designation: { contains: search as string, mode: "insensitive" },
            },
          ],
        }),
      },
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
        designation: true,
        mobileNumber: true,
        isEnabled: true,

        // createdProjects: {
        //   select: {
        //     id: true,
        //     name: true,
        //     description: true,
        //     status: true,
        //     priority: true,
        //     clientName: true,
        //     startDate: true,
        //     endDate: true,
        //     devUrl: true,
        //     prodUrl: true,
        //     uatUrl: true,
        //     developers: true,
        //   },
        //   take: 5,
        // },
      },
    }),

    prisma.user.count({
      where: {
        addedById: id,
        isDeleted: false,
      },
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
      designation: true,
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
      designation: true,
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
      designation: true,
      mobileNumber: true,

      // ✅ Assigned Projects
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
