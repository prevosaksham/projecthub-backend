import validate from "@/middlewares/validate.middleware";
import { Router } from "express";
import authorize from "@/middlewares/role.middleware";
import authMiddleware from "@/middlewares/auth.middleware";
import {
  completeProjectSchema,
  completeProjectWithDocumentsSchema,
  createProjectSchema,
  createProjectWithDocumentsSchema,
  projectRemarkSchema,
  updateProjectSchema,
  updateProjectWithDocumentsSchema,
} from "./project.validation";
import {
  assignUsersToProject,
  completeProjectWithDocuments,
  createProject,
  createProjectRemark,
  createProjectWithDocuments,
  deassignUserFromProject,
  deleteProject,
  getAllProjects,
  getAssignableUsers,
  getIncompleteProjectCountForUser,
  getProjectById,
  getProjectByManagerId,
  toggleProject,
  updateProject,
  updateProjectWithDocuments,
} from "./project.controller";
import { upload } from "./upload.middleware";
import { parseProjectBody } from "@/common/utils/constants";
import { ROLES } from "@/common/utils/roles";

const router = Router();

router.post(
  "/create",
  authMiddleware,
  authorize("MANAGER"),
  validate(createProjectSchema),
  createProject,
);
router.patch(
  "/:id/update",
  authMiddleware,
  authorize("MANAGER"),
  validate(updateProjectSchema),
  updateProject,
);

router.get(
  "/projects",
  authMiddleware,
  authorize("ADMIN", "MANAGER", ROLES.LEADERSHIP),
  getAllProjects,
);
router.delete(
  "/:id/delete",
  authMiddleware,
  authorize("ADMIN", ROLES.LEADERSHIP),
  deleteProject,
);
router.get(
  "/:id/project",
  authMiddleware,
  authorize("MANAGER", ROLES.ADMIN, ROLES.LEADERSHIP),
  getProjectById,
);

router.get(
  "/manager/projects",
  authMiddleware,
  authorize("MANAGER"),
  getProjectByManagerId,
);

router.get(
  "/user/:userId/incomplete-projects/count",
  authMiddleware,
  authorize("ADMIN", "MANAGER", ROLES.LEADERSHIP),
  getIncompleteProjectCountForUser,
);

// create project with documents
router.post(
  "/create-project",
  authMiddleware,
  authorize(ROLES.ADMIN, ROLES.LEADERSHIP),
  upload.array("documents", 10),
  parseProjectBody,
  validate(createProjectWithDocumentsSchema),

  createProjectWithDocuments,
);
router.patch(
  "/complete-project/:id",
  authMiddleware,
  authorize(ROLES.ADMIN, ROLES.MANAGER),
  upload.array("documents", 10),
  parseProjectBody,
  validate(completeProjectWithDocumentsSchema),

  completeProjectWithDocuments,
);

router.patch(
  "/update-project/:projectId",
  authMiddleware,
  authorize("MANAGER", ROLES.LEADERSHIP, ROLES.ADMIN),
  upload.array("documents", 10),
  parseProjectBody,
  validate(updateProjectWithDocumentsSchema),
  updateProjectWithDocuments,
);

router.post(
  "/:id/assign",
  authMiddleware,
  authorize("LEADERSHIP", ROLES.ADMIN),
  assignUsersToProject,
);

router.get(
  "/assignable-users",
  authMiddleware,
  authorize("LEADERSHIP", "ADMIN"),
  getAssignableUsers,
);

router.post(
  "/:projectId/users/:userId",
  authMiddleware,
  authorize("LEADERSHIP", "ADMIN"),
  deassignUserFromProject,
);

// *****************************Remarks***************************************
router.post(
  "/:id/create-remark",
  authMiddleware,
  authorize("MANAGER"),
  validate(projectRemarkSchema),
  createProjectRemark,
);

router.patch("/:id/toggle", authMiddleware, authorize("ADMIN"), toggleProject);

export default router;
