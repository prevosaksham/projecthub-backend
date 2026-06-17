import ApiError from "@/utils/ApiError";
import catchAsync from "@/utils/catchAsync";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import {
  assignMembersToProjectServiceNew,
  completeProjectWithDocumentsService,
  createProjectRemarkService,
  createProjectWithDocumentsService,
  deassignUserFromProjectService,
  deleteProjectService,
  getAllProjectsService,
  getAssignableUsersService,
  getIncompleteProjectCountForUserService,
  getProjectByIdService,
  toggleProjectService,
  updateProjectWithDocumentsService,
} from "./project.service";
import ApiResponse from "@/utils/ApiResponse";
import { createProjectSchema } from "./project.validation";
import { getLeadershipUsersService } from "../users/user.service";
import { ROLES } from "@/common/utils/roles";

export const getAllProjects = catchAsync(
  async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || "";
    const user = req.user as {
      id: string;
      role: "ADMIN" | "MANAGER" | "LEADERSHIP" | "SUPER_ADMIN";
    };
    const projectsData = await getAllProjectsService(
      user,
      Number(page),
      Number(limit),
      search,
    );
    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          projectsData.projects.length > 0
            ? "Projects fetched successfully"
            : "Projects not found",
          projectsData,
        ),
      );
  },
);

export const deleteProject = catchAsync(async (req: Request, res: Response) => {
  const projectId = req.params.id;
  const deletedProject = await deleteProjectService(projectId);
  return res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(
        StatusCodes.OK,
        "Project deleted successfully",
        deletedProject,
      ),
    );
});

export const getProjectById = catchAsync(
  async (req: Request, res: Response) => {
    const projectId = req.params.id;
    const user = req.user as { id: string; role: string };
    const project = await getProjectByIdService(projectId, user);
    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          "Project fetched successfully",
          project,
        ),
      );
  },
);

export const getIncompleteProjectCountForUser = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.params.userId;
    const currentUser = req.user as { id: string; role: string };

    if (!userId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "User id is required");
    }

    if (currentUser.role === "MANAGER" && currentUser.id !== userId) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        "Managers can only view their own project counts",
      );
    }

    const count = await getIncompleteProjectCountForUserService(userId);

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          "Incomplete project count fetched successfully",
          { incompleteProjectCount: count },
        ),
      );
  },
);

export const createProjectWithDocuments = catchAsync(
  async (req: Request, res: Response) => {
    const validatedProject = req.body.project;
    console.log("VALIDATED PROJECT:", validatedProject);
    const files = req.files as Express.Multer.File[];

    const assignedUsers = req.body.assignedUsers || [];
    const createdById = req.user?.id;
    const role = req.user?.role;

    if (!createdById) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized user!");
    }
    if (
      role !== ROLES.ADMIN &&
      role !== ROLES.SUPER_ADMIN &&
      (!files || files.length === 0)
    ) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "At least one document is required",
      );
    }

    const result = await createProjectWithDocumentsService(
      validatedProject,
      files,
      createdById,
      assignedUsers,
    );

    return res
      .status(StatusCodes.CREATED)
      .json(
        new ApiResponse(
          StatusCodes.CREATED,
          "Project created successfully",
          result,
        ),
      );
  },
);
export const completeProjectWithDocuments = catchAsync(
  async (req: Request, res: Response) => {
    const validatedProject = req.body.project;
    console.log("VALIDATED PROJECT:", validatedProject);
    const files = req.files as Express.Multer.File[];

    const projectId = req.params.id;

    const createdById = req.user?.id;
    const role = req.user?.role;

    if (!files || files.length === 0) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "At least one document is required",
      );
    }

    if (!createdById) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized user!");
    }
    if (role !== "ADMIN" && (!files || files.length === 0)) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "At least one document is required",
      );
    }

    const result = await completeProjectWithDocumentsService(
      projectId,
      validatedProject,
      files,
      createdById,
    );

    return res
      .status(StatusCodes.CREATED)
      .json(
        new ApiResponse(
          StatusCodes.CREATED,
          "Project created successfully",
          result,
        ),
      );
  },
);

export const updateProjectWithDocuments = catchAsync(
  async (req: Request, res: Response) => {
    const projectId = req.params.projectId;
    const updatedById = req.user?.id;
    if (!updatedById) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized user");
    }
    const projectData = req.body.project;
    const files = req.files as Express.Multer.File[];
    if (
      (!projectData || Object.keys(projectData).length === 0) &&
      (!files || files.length === 0)
    ) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Nothing to update");
    }
    const assignedUsers = req.body.assignedUsers || [];
    // undefined => existing documents ko chhedo mat; array (empty bhi) => keep-list
    const existingDocuments = req.body.existingDocuments;
    console.log("assignedUsers:", req.body.assignedUsers);
    console.log("type:", typeof req.body.assignedUsers);
    const result = await updateProjectWithDocumentsService(
      projectId,
      projectData,
      files,
      updatedById,
      assignedUsers,
      existingDocuments,
    );

    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(StatusCodes.OK, "Project updated successfully", result),
      );
  },
);

export const assignUsersToProject = catchAsync(
  async (req: Request, res: Response) => {
    const projectId = req.params.id;
    const { userIds } = req.body;
    const currentUser = req.user as { id: string; role: string };

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "User IDs are required");
    }
    const result = await assignMembersToProjectServiceNew(
      projectId,
      userIds,
      currentUser,
    );
    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          "Users assigned to project successfully",
          result,
        ),
      );
  },
);

export const getLeadershipUsers = catchAsync(
  async (req: Request, res: Response) => {
    const users = await getLeadershipUsersService();
    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          "Leadership users fetched successfully",
          users,
        ),
      );
  },
);
export const getAssignableUsers = catchAsync(
  async (req: Request, res: Response) => {
    const users = await getAssignableUsersService(req.user);
    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          "Assignable users fetched successfully!",
          users,
        ),
      );
  },
);

export const deassignUserFromProject = catchAsync(
  async (req: Request, res: Response) => {
    const { projectId, userId } = req.params;
    const projects = await deassignUserFromProjectService(
      projectId,
      userId,
      req.user,
    );
    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          "User removed from project successfully",
          projects,
        ),
      );
  },
);

export const createProjectRemark = catchAsync(
  async (req: Request, res: Response) => {
    const projectId = req.params.id;
    const { remark } = req.body;
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized user");
    }
    const result = await createProjectRemarkService(projectId, remark, userId);
    return res
      .status(StatusCodes.OK)
      .json(
        new ApiResponse(
          StatusCodes.OK,
          "Remark added to project successfully",
          result,
        ),
      );
  },
);

export const toggleProject = catchAsync(async (req: Request, res: Response) => {
  const projectId = req.params?.id;
  const { isEnabled } = req.body;
  if (!projectId) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Project id is required");
  }
  if (typeof isEnabled !== "boolean") {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "isEnabled must be a boolean (true/false)",
    );
  }
  const updatedProject = await toggleProjectService(projectId, isEnabled);
  const message = isEnabled
    ? "Project has been enabled successfully"
    : "Project has been disabled successfully";
  return res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, message, updatedProject));
});
