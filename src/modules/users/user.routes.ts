import { Router } from "express";
import {
  findAllUsers,
  findUserById,
  findUserProjects,
  getRoles,
  toggleUser,
} from "./user.controller";
import authMiddleware from "@/middlewares/auth.middleware";
import authorize from "@/middlewares/role.middleware";
import validate from "@/middlewares/validate.middleware";
import { ROLES } from "@/common/utils/roles";

const router = Router();

router.get("/", authMiddleware, authorize("ADMIN"), findAllUsers);

router.get(
  "/me",
  authMiddleware,
  authorize("ADMIN", "MANAGER", ROLES.LEADERSHIP),
  findUserById,
);
router.get(
  "/:id/projects",
  authMiddleware,
  authorize("ADMIN"),
  findUserProjects,
);
router.patch("/:id/toggle", authMiddleware, authorize("ADMIN"), toggleUser);
router.get(
  "/roles",
  authMiddleware,
  authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  getRoles,
);

export default router;
