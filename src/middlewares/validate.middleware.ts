import { ZodError, ZodTypeAny } from "zod";

import { Request, Response, NextFunction } from "express";

const validate =
  (schema: ZodTypeAny) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // await schema.parseAsync(req.body);
      req.body = await schema.parseAsync(req.body);
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,

          message: "Validation failed",

          errors: error.issues.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        });
      }

      return next(error);
    }
  };

export default validate;
