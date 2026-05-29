import z from "zod";

export const createUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Invalid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters long")
    .max(20, "Password too long"),
  role: z
    .enum(["ADMIN", "MANAGER", "LEADERSHIP"])
    .optional()
    .default("MANAGER"),
  empId: z.string().regex(/^PIS\d{4,5}$/, {
    message: "EmpId must be in format PIS + digits  (e.g., PIS1001,PIS10001)",
  }),
  designation: z.string().trim().min(1, "Designation is required"),
  mobileNumber: z
    .string()
    .trim()
    .regex(/^\d{10}$/, "Mobile number must be exactly 10 digits"),
});

export const loginUserSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters long")
    .max(20, "Password too long"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export type loginUserInput = z.infer<typeof loginUserSchema>;
