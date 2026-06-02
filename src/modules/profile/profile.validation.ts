import z from "zod";

export const editProfileSchema = z
  .object({
    name: z.string().min(2).optional(),
    mobileNumber: z.string().min(10).max(15).optional(),
  })
  .strict();

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(6),
  newPassword: z.string().min(6),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type EditProfileInput = z.infer<typeof editProfileSchema>;
