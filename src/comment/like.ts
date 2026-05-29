import express, { Request, Response, NextFunction } from "express";
import middleware from "../utils/middleware.ts";
import prisma from "../utils/prisma.ts";
import { AppError } from "../utils/error.ts";

const router = express.Router();

router.post(
    "/:id",
    middleware,
    async (req: Request, res: Response, next: NextFunction) => {
        const postId = Number(req.params.id);
        const com = await prisma.comment.findUnique({
            where: {
                id: postId,
            },
        });
        if (!com) return next(new AppError("invalid comment id", 404));
        const r = await prisma.commentLike.create({
            data: {
                userId: res.locals.id,
                commentId: postId,
            },
        });
        if (!r) return next(new AppError("internal database error", 500));
        res.status(200).json({
            msg: "like created",
        });
    },
);

// delete comment like
router.delete(
    "/:id",
    middleware,
    async (req: Request, res: Response, next: NextFunction) => {
        const postId = Number(req.params.id);
        const com = await prisma.comment.findUnique({
            where: {
                id: postId,
            },
        });
        if (!com) return next(new AppError("invalid commentid", 404));
        const r = await prisma.commentLike.delete({
            where: {
                userId_commentId: {
                    userId: res.locals.id,
                    commentId: postId,
                },
            },
        });
        if (!r) return next(new AppError("internal db error", 500));
        res.status(200).json({ msg: "comment unliked!" });
    },
);


export default router;