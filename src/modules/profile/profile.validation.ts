import z from "zod";

export const editProfileSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Name is required")
      .max(80, "Name is too long")
      .optional(),
    mobileNumber: z
      .string()
      .trim()
      .min(10, "Mobile number is required")
      .max(10, "Mobile number must be exactly 10 digits")
      .optional(),
  })
  .strict();

export const changePasswordSchema = z.object({
  oldPassword: z
    .string()
    .min(6, "Old password must be at least 6 characters long"),
  newPassword: z
    .string()
    .min(6, "New password must be at least 6 characters long"),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type EditProfileInput = z.infer<typeof editProfileSchema>;
