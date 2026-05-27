import express, { Request, Response, NextFunction } from "express";
import auth from "../utils/middleware.js";
import { AppError } from "../utils/error.js";
import prisma from "../utils/prisma.js";

const router = express.Router();

// followed users feed (default)
router.get(
    "/followed",
    auth,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const following = await prisma.follow.findMany({
                where: {
                    followerId: res.locals.id,
                },
                select: {
                    followingId: true,
                },
            });

            const followingIds = following.map((f) => f.followingId);

            const posts = await prisma.post.findMany({
                where: {
                    authorId: {
                        in: followingIds,
                    },
                },
                include: {
                    author: {
                        select: {
                            username: true,
                        },
                    },
                    comments: {
                        include: {
                            author: {
                                select: {
                                    username: true,
                                },
                            },
                        },
                        orderBy: {
                            createdAt: "asc",
                        },
                    },
                    _count: {
                        select: {
                            likes: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
            });

            const formattedPosts = posts.map((post) => ({
                id: String(post.id),
                author: post.author.username,
                content: post.text,
                timestamp: post.createdAt,
                likes: post._count.likes,
                comments: post.comments.map((comment) => ({
                    id: String(comment.id),
                    author: comment.author.username,
                    content: comment.text,
                    timestamp: comment.createdAt,
                })),
            }));

            res.json({
                msg: "feed fetched",
                posts: formattedPosts,
            });
        } catch (error) {
            return next(new AppError("internal db error", 500));
        }
    },
);

// random global feed with offset pagination
router.get(
    "/",
    auth,
    async (req: Request, res: Response, next: NextFunction) => {
        const offset = Number(req.query.offset ?? 0);
        const limit = Number(req.query.limit ?? 10);

        if (Number.isNaN(offset) || offset < 0) {
            return next(new AppError("invalid offset", 400));
        }

        if (Number.isNaN(limit) || limit < 1 || limit > 50) {
            return next(new AppError("invalid limit", 400));
        }

        try {
            const posts = await prisma.$queryRaw`
            select
                p.id,
                p.text,
                p."authorId",
                p."createdAt"
            from "Post" p
            order by p."createdAt" desc, p.id desc
            offset ${offset}
            limit ${limit}
        `;

            res.json({
                msg: "random feed fetched",
                offset,
                limit,
                posts,
            });
        } catch (error) {
            return next(new AppError("internal db error", 500));
        }
    },
);

// followed users feed with offset pagination
router.get(
    "/following",
    auth,
    async (req: Request, res: Response, next: NextFunction) => {
        const offset = Number(req.query.offset ?? 0);
        const limit = Number(req.query.limit ?? 10);

        if (Number.isNaN(offset) || offset < 0) {
            return next(new AppError("invalid offset", 400));
        }

        if (Number.isNaN(limit) || limit < 1 || limit > 50) {
            return next(new AppError("invalid limit", 400));
        }

        try {
            const following = await prisma.follow.findMany({
                where: {
                    followerId: res.locals.id,
                },
                select: {
                    followingId: true,
                },
            });

            const followingIds = following.map((f) => f.followingId);

            const posts = await prisma.post.findMany({
                where: {
                    authorId: {
                        in: followingIds,
                    },
                },
                include: {
                    author: {
                        select: {
                            id: true,
                            username: true,
                        },
                    },
                    _count: {
                        select: {
                            likes: true,
                            comments: true,
                        },
                    },
                },
                skip: offset,
                take: limit,
                orderBy: {
                    createdAt: "desc",
                },
            });

            res.json({
                msg: "following feed fetched",
                offset,
                limit,
                posts,
            });
        } catch (error) {
            return next(new AppError("internal db error", 500));
        }
    },
);

export default router;
