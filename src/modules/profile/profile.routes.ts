import { Router } from "express";

import authMiddleware from "@/middlewares/auth.middleware";

import validate from "@/middlewares/validate.middleware";

import { changePasswordSchema, editProfileSchema } from "./profile.validation";

import { getProfile, editProfile, changePassword } from "./profile.controller";
import authorize from "@/middlewares/role.middleware";
import { ROLES } from "@/common/utils/roles";

const router = Router();

// GET PROFILE

router.get(
  "/me",
  authMiddleware,
  authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPER_ADMIN, ROLES.LEADERSHIP),
  getProfile,
);

// EDIT PROFILE

router.patch(
  "/edit-profile",
  authMiddleware,
  authorize(ROLES.MANAGER, ROLES.ADMIN, ROLES.LEADERSHIP, ROLES.SUPER_ADMIN),
  validate(editProfileSchema),
  editProfile,
);

// CHANGE PASSWORD

router.patch(
  "/change-password",
  authMiddleware,
  authorize(ROLES.MANAGER, ROLES.ADMIN, ROLES.LEADERSHIP),
  validate(changePasswordSchema),
  changePassword,
);

export default router;
