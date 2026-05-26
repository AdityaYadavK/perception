import express, { Request, Response, NextFunction } from "express";
import auth from "../utils/middleware.js";
import { AppError } from "../utils/error.js";
import prisma from "../utils/prisma.js";

const router = express.Router();

const likePost = async (
    postId: number,
    userId: number,
    res: Response,
    next: NextFunction,
) => {
    const post = await prisma.post.findUnique({
        where: { id: postId },
    });
    if (!post) return next(new AppError("post not found", 404));

    const alreadyLiked = await prisma.like.findUnique({
        where: {
            userId_postId: {
                userId,
                postId,
            },
        },
    });
    if (alreadyLiked) return next(new AppError("post already liked", 400));

    await prisma.like.create({
        data: {
            userId,
            postId,
        },
    });

    res.json({
        msg: "post liked",
    });
};

// like a post
router.post(
    "/",
    auth,
    async (req: Request, res: Response, next: NextFunction) => {
        const postId = Number(req.body?.postId);
        if (Number.isNaN(postId)) return next(new AppError("invalid id", 400));

        const userId = res.locals.id;

        return likePost(postId, userId, res, next);
    },
);

// like a post
router.post(
    "/:id",
    auth,
    async (req: Request, res: Response, next: NextFunction) => {
        const postId = Number(req.params.id);
        if (Number.isNaN(postId)) return next(new AppError("invalid id", 400));

        const userId = res.locals.id;

        return likePost(postId, userId, res, next);
    },
);

// unlike a post
router.delete(
    "/:id",
    auth,
    async (req: Request, res: Response, next: NextFunction) => {
        const postId = Number(req.params.id);
        if (Number.isNaN(postId)) return next(new AppError("invalid id", 400));

        const userId = res.locals.id;

        const exist = await prisma.like.findUnique({
            where: {
                userId_postId: {
                    userId,
                    postId,
                },
            },
        });
        if (!exist) return next(new AppError("like not found", 404));

        await prisma.like.delete({
            where: {
                userId_postId: {
                    userId,
                    postId,
                },
            },
        });

        res.json({
            msg: "post unliked",
        });
    },
);

// get likes of a post
router.get(
    "/:id",
    auth,
    async (req: Request, res: Response, next: NextFunction) => {
        const postId = Number(req.params.id);
        if (Number.isNaN(postId)) return next(new AppError("invalid id", 400));

        const post = await prisma.post.findUnique({
            where: { id: postId },
        });
        if (!post) return next(new AppError("post not found", 404));

        const likes = await prisma.like.findMany({
            where: {
                postId,
            },
            select: {
                user: {
                    select: {
                        id: true,
                        username: true,
                    },
                },
                createdAt: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        res.json({
            likes,
            count: likes.length,
        });
    },
);

export default router;
