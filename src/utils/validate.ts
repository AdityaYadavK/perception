import z from "zod";
import { AppError } from "./error.ts";
import { Request, Response, NextFunction } from "express";

export const validate =
    (schema: z.ZodTypeAny) =>
    (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body);
        if (!result.success)
            return next(new AppError("schema validation failed", 400));
        req.body = result.data;
        next();
    };
