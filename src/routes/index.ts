import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes";
import projectRoutes from "../modules/projects/project.routes";
import userRoutes from "../modules/users/user.routes";
import dashboardRoutes from "../modules/dashboard/dashboard.routes";
import profileRoutes from "../modules/profile/profile.routes";
const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

router.use("/auth", authRoutes);
router.use("/project", projectRoutes);
router.use("/users", userRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/profile", profileRoutes)

export default router;
