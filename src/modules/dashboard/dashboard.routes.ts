import { Router } from "express";

import authMiddleware from "@/middlewares/auth.middleware";

import authorize from "@/middlewares/role.middleware";

import { getDashboard } from "./dashboard.controller";
import { ROLES } from "@/common/utils/roles";

const router = Router();

router.get(
  "/",
  authMiddleware,
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.LEADERSHIP),
  getDashboard,
);

export default router;
