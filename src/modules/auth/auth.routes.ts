import validate from "@/middlewares/validate.middleware";
import { Router } from "express";
import { createUserSchema, loginUserSchema } from "./auth.validation";
import { createUser, loginUser } from "./auth.controller";
import authorize from "@/middlewares/role.middleware";
import authMiddleware from "@/middlewares/auth.middleware";
import { ROLES } from "@/common/utils/roles";

const router = Router();

router.post(
  "/register",
  authMiddleware,
  authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  validate(createUserSchema),
  createUser,
);
router.post("/login", validate(loginUserSchema), loginUser);

export default router;
