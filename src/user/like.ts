import express, { Request, Response, NextFunction } from "express";
import middleware from "../utils/middleware.ts";
const router = express.Router();
import prisma from "../utils/prisma.ts";
import { AppError } from "../utils/error.ts";

// get likes of a user
router.get(
    "/",
    middleware,
    async (req: Request, res: Response, next: NextFunction) => {
        const us = await prisma.user.findUnique({
            where: {
                id: res.locals.id,
            },
        });
        if (!us) return next(new AppError("invalid user", 404));
        // user -> likes -> post -> author
        const liked = await prisma.like.findMany({
            where: {
                userId: res.locals.id,
            },
            select: {
                postId : true
            }
        });
        res.status(200).json({ liked });
    },
);

export default router;
