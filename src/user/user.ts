import express, { Request, Response, NextFunction } from "express";
import middleware from "../utils/middleware.ts";
import { AppError } from "../utils/error.ts";
import prisma from "../utils/prisma.ts";

const router = express.Router();

router.get(
    "/:id",
    middleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = Number(req.params.id);

            if (!Number.isInteger(id) || id <= 0) {
                return next(new AppError("invalid id", 400));
            }

            const user = await prisma.user.findUnique({
                where: { id },
                select: {
                    id: true,
                    username: true,
                    createdAt: true,

                    posts: {
                        select: {
                            id: true,
                            text: true,
                            createdAt: true,
                            _count: {
                                select: {
                                    likes: true,
                                    comments: true,
                                },
                            },
                        },
                        orderBy: {
                            createdAt: "desc",
                        },
                    },

                    likes: {
                        select: {
                            createdAt: true,
                            post: {
                                select: {
                                    id: true,
                                    text: true,
                                    createdAt: true,
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
                            },
                        },
                        orderBy: {
                            createdAt: "desc",
                        },
                    },

                    _count: {
                        select: {
                            posts: true,
                            likes: true,
                            followers: true,
                            following: true,
                        },
                    },
                },
            });

            if (!user) {
                return next(new AppError("user not found", 404));
            }

            return res.status(200).json({
                user: {
                    id: user.id,
                    username: user.username,
                    createdAt: user.createdAt,
                    counts: user._count,
                    posts: user.posts,
                    likedPosts: user.likes.map((like) => ({
                        likedAt: like.createdAt,
                        ...like.post,
                    })),
                },
            });
        } catch (error) {
            return next(error);
        }
    },
);

export default router;
