import z from "zod";
import { AppError } from "./error.js";
import { Request, Response, NextFunction } from "express";

const schema = z.object({
    username: z.string().min(4).max(20),
    email: z.string().email(),
    password: z.string().min(6).max(12),
});

export const validate =
    (schema: z.ZodTypeAny) =>
    (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body);
        if (!result.success)
            return next(new AppError("schema validation failed", 400));
        req.body = result.data;
        next();
    };
