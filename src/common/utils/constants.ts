import ApiError from "@/utils/ApiError";
import { NextFunction, Request, Response } from "express";

export function formatFileSize(bytes: any): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export const parseProjectBody = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    if (req.body.project) {
      req.body.project = JSON.parse(req.body.project);
    }
    // if (req.body.assignedUsers) {
    //   req.body.assignedUsers = Array.isArray(req.body.assignedUsers)
    //     ? req.body.assignedUsers
    //     : [req.body.assignedUsers];
    // }

    if (req.body.assignedUsers) {
      req.body.assignedUsers = JSON.parse(req.body.assignedUsers);
    }
    if (req.body.project && typeof req.body.project === "object") {
      Object.keys(req.body.project).forEach((key) => {
        if (req.body.project[key] === "") {
          req.body.project[key] = undefined;
        }
      });
    }

    next();
  } catch (error) {
    next(new ApiError(400, "Invalid project JSON"));
  }
};

const PROJECT_SETUP_FIELDS = [
  "name",
  "description",
  "status",
  "priority",
  "clientName",
  "startDate",
  "endDate",
  "devUrl",
  "uatUrl",
  "prodUrl",
  "developers",
];

const isValueFilled = (value: any) => {
  if (Array.isArray(value)) return value.length > 0;
  return value !== null && value !== undefined && value !== "";
};

export const isProjectFullyFilled = (project: any) => {
  return PROJECT_SETUP_FIELDS.every((field) => isValueFilled(project[field]));
};
