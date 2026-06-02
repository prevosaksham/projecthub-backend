import { prisma } from "@/db/prisma";
import {
  CompleteProjectInput,
  CreateDocumentInput,
  CreateProjectInput,
  ProjectRemarkInput,
  UpdateProjectInput,
} from "./project.validation";
import ApiError from "@/utils/ApiError";
import { StatusCodes } from "http-status-codes";
import { formatFileSize, isProjectFullyFilled } from "@/common/utils/constants";
import { Role } from "@prisma/client";

export const getAllProjectsService = async (
  user: { id: string; role: string },
  page: number = 1,
  limit: number = 10,
  search: string = "",
) => {
  const safePage = Math.max(page, 1);
  const safeLimit = Math.max(limit, 1);
  const skip = (safePage - 1) * safeLimit;

  let whereClause: any = {
    isDeleted: false,
  };

  if (search.trim()) {
    whereClause.name = {
      contains: search.trim(),
      mode: "insensitive",
    };
  }

  if (user.role === "ADMIN") {
    whereClause = {
      ...whereClause,
      createdById: user.id,
    };
  } else if (user.role === "LEADERSHIP") {
    whereClause = {
      ...whereClause,
      isEnabled: true,
      OR: [
        {
          createdById: user.id,
        },
        {
          members: {
            some: {
              assignedToId: user.id,
              isDeleted: false,
            },
          },
        },
      ],
    };
  } else if (user.role === "MANAGER") {
    whereClause = {
      ...whereClause,
      isEnabled: true,
      members: {
        some: {
          assignedToId: user.id,
          isDeleted: false,
        },
      },
    };
  }

  const [total, projects] = await Promise.all([
    prisma.project.count({ where: whereClause }),

    prisma.project.findMany({
      where: whereClause,
      skip,
      take: safeLimit,
      include: {
        documents: true,
        // members: {
        //   where: {
        //     isDeleted: false,
        //   },
        // },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  return {
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.ceil(total / safeLimit),
    projects,
  };
};
export const getProjectByIdService = async (
  projectId: string,
  currentUser: { id: string; role: string },
) => {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      isDeleted: false,
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
      uatUrl: true,
      prodUrl: true,
      developers: true,
      createdAt: true,
      updatedAt: true,

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

      // Assigned Users
      members: {
        where: {
          isDeleted: false,
        },
        select: {
          id: true,
          assignedAt: true,

          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              empId: true,
              isEnabled: true,
            },
          },

          assignedBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          assignedAt: "desc",
        },
      },

      remarks: {
        where: {
          isDeleted: false,
        },
        select: {
          remark: true,
          createdAt: true,
          addedBy: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },

      // Optional: creator info (useful for UI)
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  if (!project) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Project not found");
  }
  const canManageMembers =
    currentUser.role === "ADMIN" ||
    (currentUser.role === "LEADERSHIP" &&
      project.createdBy.id === currentUser.id);
  return {
    ...project,
    canManageMembers,
  };
};

export const deleteProjectService = async (projectId: string) => {
  const existingProject = await prisma.project.findFirst({
    where: {
      id: projectId,
      isDeleted: false,
    },
  });
  if (!existingProject) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Project not found");
  }
  const deletedProject = await prisma.project.update({
    where: {
      id: projectId,
    },

    data: {
      isDeleted: true,
    },
  });

  return deletedProject;
};

export const getIncompleteProjectCountForUserService = async (
  userId: string,
) => {
  return prisma.project.count({
    where: {
      isDeleted: false,
      isEnabled: true,
      isSetupCompleted: false,
      OR: [
        {
          createdById: userId,
        },
        {
          members: {
            some: {
              assignedToId: userId,
              isDeleted: false,
            },
          },
        },
      ],
    },
  });
};

// ***********************************Documents*****************************************

export const createProjectWithDocumentsService = async (
  projectData: CreateProjectInput,
  files: Express.Multer.File[],
  createdById: string,
  assignedUsers: string[] = [],
) => {
  return prisma.$transaction(async (tx) => {
    const isSetupCompleted =
      isProjectFullyFilled(projectData) &&
      files?.length > 0 &&
      assignedUsers?.length > 0;
    // Create project
    const project = await tx.project.create({
      data: {
        name: projectData.name,
        description: projectData.description ?? null,
        status: projectData.status,
        priority: projectData.priority,
        clientName: projectData.clientName ?? null,
        startDate: projectData.startDate ?? null,
        endDate: projectData.endDate ?? null,
        devUrl: projectData.devUrl ?? null,
        uatUrl: projectData.uatUrl ?? null,
        prodUrl: projectData.prodUrl ?? null,
        developers: projectData.developers ?? [],
        createdById,
        isSetupCompleted,
      },
    });

    // Create documents
    const documents = await Promise.all(
      files.map((file) =>
        tx.document.create({
          data: {
            name: file.originalname,
            url: file.filename,
            fileType: file.mimetype,
            fileSize: formatFileSize(file.size),

            projectId: project.id,
            uploadedById: createdById,
          },
        }),
      ),
    );

    const uniqueUsers = [...new Set(assignedUsers)];
    // ================= ASSIGN USERS =================
    if (uniqueUsers.length > 0) {
      await tx.projectMember.createMany({
        data: uniqueUsers.map((userId) => ({
          projectId: project.id,
          assignedToId: userId,
          assignedById: createdById,
        })),
        skipDuplicates: true,
      });
    }
    // fetch assignment details
    const projectAssignments = await tx.projectMember.findMany({
      where: {
        projectId: project.id,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    return {
      project,
      documents,
      assignedUsers: projectAssignments.map((x) => ({
        id: x.assignedTo.id,
        name: x.assignedTo.name,
        email: x.assignedTo.email,
      })),
    };
  });
};
export const completeProjectWithDocumentsService = async (
  projectId: string,
  projectData: CompleteProjectInput,
  files: Express.Multer.File[],
  createdById: string,
) => {
  return prisma.$transaction(async (tx) => {
    const existingProject = await tx.project.findFirst({
      where: { id: projectId },
    });
    if (!existingProject) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Project not found");
    }
    if (existingProject.isSetupCompleted) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Project setup already completed",
      );
    }
    const project = await tx.project.update({
      where: {
        id: projectId,
      },
      data: {
        description: projectData.description,
        status: projectData.status,
        clientName: projectData.clientName,
        endDate: projectData.endDate,
        devUrl: projectData.devUrl,
        uatUrl: projectData.uatUrl,
        prodUrl: projectData.prodUrl,
        developers: projectData.developers,
        isSetupCompleted: true,
      },
    });

    const documents = await Promise.all(
      (files ?? []).map((file) =>
        tx.document.create({
          data: {
            name: file.originalname,
            url: file.filename,
            fileType: file.mimetype,
            fileSize: formatFileSize(file.size),
            projectId: project.id,
            uploadedById: createdById,
          },
        }),
      ),
    );
    return {
      project,
      documents,
    };
  });
};

export const updateProjectWithDocumentsService = async (
  projectId: string,
  projectData: UpdateProjectInput,
  files: Express.Multer.File[],
  updatedById: string,
  assignedUsers: string[] = [],
) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const existingProject = await tx.project.findFirst({
        where: { id: projectId },
        include: {
          documents: true,
          members: true,
        },
      });

      if (!existingProject) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Project not found");
      }
      const mergedProject = {
        ...existingProject,
        ...projectData,
      };

      console.log("FILESSSSSs", files);

      console.log("MERGED PROJECT:", mergedProject);

      const hasDocs = existingProject.documents.length > 0 || files.length > 0;
      const hasAssignedUsers =
        existingProject.members.length > 0 || assignedUsers.length > 0;

      const recalculatedSetupCompleted =
        isProjectFullyFilled(mergedProject) && hasDocs && hasAssignedUsers;

      console.log(
        "RECALCULATED SETUP COMPLETED:::",
        recalculatedSetupCompleted,
      );
      console.log(
        "EXISTING SETUP COMPLETED:::",
        existingProject.isSetupCompleted,
      );
      const finalSetupCompleted =
        recalculatedSetupCompleted || existingProject.isSetupCompleted;

      console.log("FINALLLLLLLLLLLLLLLLLLLL:::", finalSetupCompleted);

      let updatedProject;
      try {
        updatedProject = await tx.project.update({
          where: { id: projectId },
          data: {
            ...projectData,
            isSetupCompleted: finalSetupCompleted,
          },
        });
      } catch (err) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Failed to update project");
      }
      let documents: any[] = [];
      if (files?.length) {
        try {
          documents = await Promise.all(
            files.map((file) =>
              tx.document.create({
                data: {
                  name: file.originalname,
                  url: file.filename,
                  fileType: file.mimetype,
                  fileSize: formatFileSize(file.size),
                  projectId,
                  uploadedById: updatedById,
                },
              }),
            ),
          );
        } catch (err) {
          throw new ApiError(
            StatusCodes.BAD_REQUEST,
            "Failed to upload documents",
          );
        }
      }

      // ================= ASSIGN USERS =================
      if (assignedUsers.length > 0) {
        // STEP 1:
        // Soft delete removed users
        // Example:
        // Old: Rahul, Amit
        // New: Rahul
        // Result: Amit -> isDeleted=true

        await tx.projectMember.updateMany({
          where: {
            projectId,
            assignedToId: {
              notIn: assignedUsers,
            },
            isDeleted: false,
          },

          data: {
            isDeleted: true,
            deletedAt: new Date(),
            removedById: updatedById,
          },
        });

        // STEP 2:
        // Reactivate previously removed users
        // Example:
        // Amit was deleted before
        // New request contains Amit again

        await tx.projectMember.updateMany({
          where: {
            projectId,
            assignedToId: {
              in: assignedUsers,
            },
            isDeleted: true,
          },

          data: {
            isDeleted: false,
            deletedAt: null,
            removedById: null,
            assignedById: updatedById,
          },
        });

        // STEP 3:
        // Get all members

        const allMembers = await tx.projectMember.findMany({
          where: {
            projectId,
          },

          select: {
            assignedToId: true,
            isDeleted: true,
          },
        });

        // STEP 4:
        // Active users only

        const activeIds = new Set(
          allMembers.filter((m) => !m.isDeleted).map((m) => m.assignedToId),
        );

        // STEP 5:
        // Find completely new users

        const newAssignments = assignedUsers.filter((id) => !activeIds.has(id));

        // STEP 6:
        // Insert new users

        if (newAssignments.length > 0) {
          await tx.projectMember.createMany({
            data: newAssignments.map((userId) => ({
              projectId,
              assignedToId: userId,
              assignedById: updatedById,
            })),

            skipDuplicates: true,
          });
        }
      }
      const members = await tx.projectMember.findMany({
        where: {
          projectId,
          isDeleted: false,
          isEnabled: true,
        },

        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
      return {
        project: updatedProject,
        documents,

        assignedUsers: members.map((m) => ({
          id: m.assignedTo.id,
          name: m.assignedTo.name,
          email: m.assignedTo.email,
        })),
      };
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Prisma specific error fallback
    if (error instanceof Error) {
      throw new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        error.message || "Something went wrong while updating project",
      );
    }

    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Unexpected server error",
    );
  }
};

// ***********************************Member Assignment*****************************************

export const assignMembersToProjectService = async (
  projectId: string,
  userIds: string[],
  currentUser: any,
) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId, isDeleted: false },
  });
  if (!project) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Project not found");
  }
  if (currentUser.role === "MANAGER") {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "You are not authorized to assign members to this project",
    );
  }
  const isAdmin = currentUser.role === Role.ADMIN;
  const isOwner =
    project.createdById === currentUser.id &&
    currentUser.role === Role.LEADERSHIP;

  if (!isAdmin && !isOwner) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Not Allowed");
  }
  if (currentUser.role === Role.LEADERSHIP) {
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds },
        isDeleted: false,
        isEnabled: true,
      },
      select: {
        id: true,
        role: true,
      },
    });
    const invalidUsers = users.filter((u) => u.role !== Role.LEADERSHIP);
    if (invalidUsers.length > 0) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Leadership can only assign other leadership members",
      );
    }
  }
  return prisma.projectMember.createMany({
    data: userIds.map((userId) => ({
      projectId,
      assignedToId: userId,
      assignedById: currentUser.id,
    })),
    skipDuplicates: true,
  });
};

export const assignMembersToProjectServiceNew = async (
  projectId: string,
  userIds: string[],
  currentUser: any,
) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId, isDeleted: false },
  });

  if (!project) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Project not found");
  }

  if (currentUser.role === Role.MANAGER) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "You are not authorized to assign members to this project",
    );
  }

  const isAdmin = currentUser.role === Role.ADMIN;

  const isOwner =
    project.createdById === currentUser.id &&
    currentUser.role === Role.LEADERSHIP;

  if (!isAdmin && !isOwner) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Not Allowed");
  }

  // ================= FETCH USERS =================
  const users = await prisma.user.findMany({
    where: {
      id: { in: userIds },
      isDeleted: false,
      isEnabled: true,
    },
    select: {
      id: true,
      role: true,
    },
  });

  // ================= ROLE VALIDATION =================

  // LEADERSHIP rule → only leadership users
  if (currentUser.role === Role.LEADERSHIP) {
    const invalidUsers = users.filter((u) => u.role !== Role.LEADERSHIP);

    if (invalidUsers.length > 0) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Leadership can only assign leadership members",
      );
    }
  }

  // ADMIN rule → manager + leadership only
  if (isAdmin) {
    const invalidUsers = users.filter(
      (u) => u.role !== Role.MANAGER && u.role !== Role.LEADERSHIP,
    );

    if (invalidUsers.length > 0) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Admin can only assign manager and leadership members",
      );
    }
  }

  // ================= ASSIGN / RESTORE =================

  for (const userId of userIds) {
    const existing = await prisma.projectMember.findFirst({
      where: {
        projectId,
        assignedToId: userId,
      },
    });

    if (existing) {
      // 🔁 RESTORE soft-deleted assignment
      await prisma.projectMember.update({
        where: {
          id: existing.id,
        },
        data: {
          isDeleted: false,
          deletedAt: null,
          isEnabled: true,
          assignedById: currentUser.id,
          assignedAt: new Date(),
        },
      });
    } else {
      // ➕ NEW assignment
      await prisma.projectMember.create({
        data: {
          projectId,
          assignedToId: userId,
          assignedById: currentUser.id,
        },
      });
    }
  }

  return {
    success: true,
    message: "Members assigned successfully",
  };
};

export const getAssignableUsersService = async (currentUser: any) => {
  let roleFilter: Role[] = [];

  if (
    currentUser.role === Role.ADMIN ||
    currentUser.role === Role.SUPER_ADMIN
  ) {
    roleFilter = [Role.MANAGER];
  }

  if (currentUser.role === Role.LEADERSHIP) {
    roleFilter = [Role.LEADERSHIP];
  }

  if (currentUser.role === Role.MANAGER) {
    return [];
  }

  return prisma.user.findMany({
    where: {
      isDeleted: false,
      isEnabled: true,
      role: {
        in: roleFilter,
      },
    },
    select: {
      id: true,
      name: true,
      role: true,
      email: true,
    },
  });
};

export const deassignUserFromProjectService = async (
  projectId: string,
  assignedToId: string,
  currentUser: any,
) => {
  const existing = await prisma.projectMember.findFirst({
    where: {
      projectId,
      assignedToId,
      isDeleted: false,
      isEnabled: true,
    },
  });

  if (!existing) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not assigned");
  }

  await prisma.projectMember.update({
    where: {
      id: existing.id,
    },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      removedById: currentUser.id,
      isEnabled: false,
    },
  });

  return {
    success: true,
    message: "User removed from project successfully",
  };
};

// ***********************************Project Remarks*****************************************

export const createProjectRemarkService = async (
  projectId: string,
  remark: string,
  userId: string,
) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId, isDeleted: false },
  });
  if (!project) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Project not found");
  }
  return prisma.projectRemark.create({
    data: {
      projectId,
      remark,
      addedById: userId,
    },
  });
};

// ***********************************Enable Disable Services*****************************************
export const toggleProjectService = async (
  projectId: string,
  isEnabled: boolean,
) => {
  const project = await prisma.project.findFirst({
    where: { id: projectId, isDeleted: false },
  });

  if (!project) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Project not found");
  }

  const updatedProject = await prisma.project.update({
    where: { id: projectId },
    data: {
      isEnabled,
    },
  });
  const responseData = {
    id: updatedProject.id,
    isEnabled: updatedProject.isEnabled,
  };
  return responseData;
};
