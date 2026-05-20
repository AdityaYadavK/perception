import express, { Request, Response, NextFunction } from "express";
import auth from "../utils/middleware.ts";
import { AppError } from "../utils/error.ts";
import prisma from "../utils/prisma.ts";

const router = express.Router();

// random global feed with offset pagination
router.get(
    "/random",
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
            order by random()
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
