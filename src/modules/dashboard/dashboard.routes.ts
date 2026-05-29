import { Router } from "express";

import authMiddleware from "@/middlewares/auth.middleware";

import authorize from "@/middlewares/role.middleware";

import { getDashboard }
  from "./dashboard.controller";

const router = Router();

router.get(
  "/",
  authMiddleware,
  authorize(
    "ADMIN",
    "MANAGER"
  ),
  getDashboard
);

export default router;