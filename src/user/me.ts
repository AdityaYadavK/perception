import express, { Request, Response, NextFunction } from "express";
import middleware from "../utils/middleware.ts";
import { AppError } from "../utils/error.ts";
import prisma from "../utils/prisma.ts";

const router = express.Router();

router.get(
    "/",
    middleware,
    async (_req: Request, res: Response, next: NextFunction) => {
        try {
            const u = await prisma.user.findUnique({
                where: {
                    id: res.locals.id,
                },
                select: {
                    id: true,
                    username: true,
                },
            });

            if (!u) {
                return next(new AppError("user not found", 404));
            }

            return res.status(200).json({ u });
        } catch (error) {
            return next(error);
        }
    },
);

export default router;
