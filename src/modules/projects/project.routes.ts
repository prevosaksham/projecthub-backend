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
  createProjectRemark,
  createProjectWithDocuments,
  deassignUserFromProject,
  deleteProject,
  getAllProjects,
  getAssignableUsers,
  getIncompleteProjectCountForUser,
  getProjectById,
  toggleProject,
  updateProjectWithDocuments,
} from "./project.controller";
import { upload } from "./upload.middleware";
import { parseProjectBody } from "@/common/utils/constants";
import { ROLES } from "@/common/utils/roles";

const router = Router();
router.get(
  "/projects",
  authMiddleware,
  authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.MANAGER, ROLES.LEADERSHIP),
  getAllProjects,
);
router.delete(
  "/:id/delete",
  authMiddleware,
  authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.LEADERSHIP),
  deleteProject,
);
router.get(
  "/:id/project",
  authMiddleware,
  authorize(ROLES.MANAGER, ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.LEADERSHIP),
  getProjectById,
);

router.get(
  "/user/:userId/incomplete-projects/count",
  authMiddleware,
  authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.LEADERSHIP),
  getIncompleteProjectCountForUser,
);

// create project with documents
router.post(
  "/create-project",
  authMiddleware,
  authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.LEADERSHIP),
  upload.array("documents", 10),
  parseProjectBody,
  validate(createProjectWithDocumentsSchema),

  createProjectWithDocuments,
);
router.patch(
  "/complete-project/:id",
  authMiddleware,
  authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.MANAGER),
  upload.array("documents", 10),
  parseProjectBody,
  validate(completeProjectWithDocumentsSchema),

  completeProjectWithDocuments,
);

router.patch(
  "/update-project/:projectId",
  authMiddleware,
  authorize(ROLES.MANAGER, ROLES.LEADERSHIP, ROLES.ADMIN, ROLES.SUPER_ADMIN),
  upload.array("documents", 10),
  parseProjectBody,
  validate(updateProjectWithDocumentsSchema),
  updateProjectWithDocuments,
);

router.post(
  "/:id/assign",
  authMiddleware,
  authorize(ROLES.LEADERSHIP, ROLES.ADMIN, ROLES.SUPER_ADMIN),
  assignUsersToProject,
);

router.get(
  "/assignable-users",
  authMiddleware,
  authorize(ROLES.LEADERSHIP, ROLES.ADMIN, ROLES.SUPER_ADMIN),
  getAssignableUsers,
);

router.post(
  "/:projectId/users/:userId",
  authMiddleware,
  authorize(ROLES.LEADERSHIP, ROLES.ADMIN, ROLES.SUPER_ADMIN),
  deassignUserFromProject,
);

// *****************************Remarks***************************************
router.post(
  "/:id/create-remark",
  authMiddleware,
  authorize(ROLES.MANAGER, ROLES.ADMIN, ROLES.SUPER_ADMIN),
  validate(projectRemarkSchema),
  createProjectRemark,
);

router.patch(
  "/:id/toggle",
  authMiddleware,
  authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  toggleProject,
);

export default router;
