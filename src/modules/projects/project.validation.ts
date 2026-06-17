import { z } from "zod";
import { ProjectPriority, ProjectStatus } from "@prisma/client";

export const createProjectSchema = z
  .object({
    name: z
      .string()
      .min(3, "Project name must be at least 3 characters")
      .max(100, "Project name is too long"),

    description: z.string().optional().nullable(),

    status: z.nativeEnum(ProjectStatus).default(ProjectStatus.PLANNING),

    priority: z.nativeEnum(ProjectPriority).default(ProjectPriority.MEDIUM),

    clientName: z.string().optional().nullable(),

    startDate: z.coerce.date().optional().nullable(),

    endDate: z.coerce.date().optional().nullable(),

    devUrl: z.string().url("Invalid Dev URL").optional().nullable(),

    uatUrl: z.string().url("Invalid UAT URL").optional().nullable(),

    prodUrl: z.string().url("Invalid Production URL").optional().nullable(),

    developers: z.array(z.string().trim().min(1)).optional().nullable(),
  })
  .refine(
    (data) => {
      if (!data.endDate || !data.startDate) return true;

      return data.endDate >= data.startDate;
    },
    {
      message: "End date must be after start date",
      path: ["endDate"],
    },
  );

export const updateProjectSchema = z
  .object({
    name: z.string().min(3).max(100).optional(),

    description: z.string().min(5).optional(),

    status: z.nativeEnum(ProjectStatus).optional(),

    priority: z.nativeEnum(ProjectPriority).optional(),

    clientName: z.string().min(2).optional(),

    startDate: z.coerce.date().optional(),

    endDate: z.coerce.date().optional(),

    devUrl: z.string().url().optional(),

    uatUrl: z.string().url().optional(),

    prodUrl: z.string().url().optional(),

    developers: z.array(z.string()).min(1).optional(),

    isEnabled: z.boolean().optional(),
  })

  .strict()

  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.endDate >= data.startDate;
      }

      return true;
    },
    {
      message: "End date must be after start date",
      path: ["endDate"],
    },
  );

export const createDocumentSchema = z.object({
  name: z.string().min(1),

  url: z.string().url(),

  fileType: z.string().optional(),

  fileSize: z.number().optional(),
});

export const createProjectWithDocumentsSchema = z.object({
  project: createProjectSchema,
  assignedUsers: z.array(z.string()).optional(),
});

export const updateProjectWithDocumentsSchema = z.object({
  project: updateProjectSchema,
  assignedUsers: z.array(z.string()).optional(),
  // jo existing documents rakhne hain unke IDs; jo isme nahi wo soft-delete honge
  existingDocuments: z.array(z.string()).optional(),
});

export const completeProjectSchema = z
  .object({
    description: z.string().min(5, "Description is required"),

    clientName: z.string().min(2, "Client name is required"),

    endDate: z.coerce.date(),

    devUrl: z.string().url("Invalid Dev URL"),

    uatUrl: z.string().url("Invalid UAT URL"),

    prodUrl: z.string().url("Invalid Production URL"),

    status: z.nativeEnum(ProjectStatus).default(ProjectStatus.PLANNING),

    developers: z
      .array(z.string().min(1))
      .min(1, "At least one developer required"),
  })
  .refine((data) => data.endDate >= new Date(), {
    message: "End date must be valid",
    path: ["endDate"],
  });

export const completeProjectWithDocumentsSchema = z.object({
  project: completeProjectSchema,
});

export const projectRemarkSchema = z.object({
  remark: z.string().min(1, "Remark cannot be empty"),
});

export type ProjectRemarkInput = z.infer<typeof projectRemarkSchema>;
export type CreateProjectWithDocumentsInput = z.infer<
  typeof createProjectWithDocumentsSchema
>;

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type CompleteProjectInput = z.infer<typeof completeProjectSchema>;
